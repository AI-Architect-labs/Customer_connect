"""DEV/STAGING/ADMIN UTILITY ONLY: provision one test owner and shop.

This is not the production owner-onboarding path. It uses Firebase Admin with
Application Default Credentials and refuses non-staging/test projects unless
``--allow-non-staging-project`` is supplied deliberately.

The password is requested with a hidden ``getpass`` prompt only when a new
Firebase Auth user must be created. Run ``--dry-run`` first to validate inputs
and inspect conflicts without prompting for a password or performing writes.
"""
from __future__ import annotations

import argparse
import getpass
import re
from dataclasses import dataclass
from email.utils import parseaddr
from typing import Any, Callable, Mapping, Sequence

SAFE_PROJECT_MARKERS = ("staging", "test", "demo", "emulator")
PROJECT_ID_PATTERN = re.compile(r"^[a-z][a-z0-9-]{4,28}[a-z0-9]$")
SHOP_ID_PATTERN = re.compile(r"^[a-z0-9](?:[a-z0-9-]{0,62}[a-z0-9])?$")
INDIAN_PHONE_PATTERN = re.compile(r"^\+91[6-9][0-9]{9}$")


class BootstrapError(RuntimeError):
    """Raised when validation or a mapping-safety check fails."""


@dataclass(frozen=True)
class BootstrapInput:
    project: str
    email: str
    shop_id: str
    shop_name: str
    owner_name: str
    phone: str
    address: str
    hours: str
    allow_non_staging_project: bool = False


@dataclass(frozen=True)
class MappingPlan:
    action: str
    create_owner: bool
    create_shop: bool


def is_safe_project(project_id: str) -> bool:
    normalized = project_id.lower()
    return normalized.startswith("demo-") or any(
        marker in normalized for marker in SAFE_PROJECT_MARKERS
    )


def validate_inputs(values: BootstrapInput) -> None:
    errors: list[str] = []
    if not PROJECT_ID_PATTERN.fullmatch(values.project):
        errors.append("project ID is malformed")
    elif not is_safe_project(values.project) and not values.allow_non_staging_project:
        errors.append(
            "project is not recognizable as staging/test; use "
            "--allow-non-staging-project only after verifying the target"
        )
    parsed_email = parseaddr(values.email)[1]
    if parsed_email != values.email or not re.fullmatch(r"[^@\s]+@[^@\s]+\.[^@\s]+", values.email):
        errors.append("email is malformed")
    if len(values.owner_name.strip()) < 2 or len(values.owner_name.strip()) > 120:
        errors.append("owner display name must contain 2-120 characters")
    if not SHOP_ID_PATTERN.fullmatch(values.shop_id):
        errors.append("shop ID must be a lowercase letter/digit/hyphen identifier")
    if len(values.shop_name.strip()) < 2 or len(values.shop_name.strip()) > 120:
        errors.append("shop name must contain 2-120 characters")
    if not INDIAN_PHONE_PATTERN.fullmatch(values.phone):
        errors.append("phone must use +91 followed by a valid 10-digit Indian mobile number")
    if len(values.address.strip()) < 5 or len(values.address.strip()) > 500:
        errors.append("address must contain 5-500 characters")
    if len(values.hours.strip()) < 3 or len(values.hours.strip()) > 250:
        errors.append("business hours must contain 3-250 characters")
    if errors:
        raise BootstrapError("Invalid bootstrap input: " + "; ".join(errors))


def evaluate_mapping_state(
    *, auth_uid: str | None, owner_data: Mapping[str, Any] | None,
    shop_data: Mapping[str, Any] | None, shop_id: str, mapped_uids: Sequence[str],
) -> MappingPlan:
    if auth_uid is None:
        if shop_data is not None or mapped_uids:
            raise BootstrapError("Shop or owner mapping exists but the requested Auth user does not.")
        return MappingPlan("create Auth user, owner mapping, and shop", True, True)
    if any(uid != auth_uid for uid in mapped_uids):
        raise BootstrapError("The shop ID is already mapped to another owner.")
    if owner_data is None and shop_data is None:
        return MappingPlan("reuse Auth user; create owner mapping and shop", True, True)
    if owner_data is None or shop_data is None:
        raise BootstrapError("Only one side of the owner/shop mapping exists; refusing partial overwrite.")
    if (owner_data.get("shopId") != shop_id or owner_data.get("role") != "owner"
            or shop_data.get("ownerUid") != auth_uid):
        raise BootstrapError("Existing owner/shop documents conflict with the requested mapping.")
    return MappingPlan("owner and shop already correctly mapped; no writes", False, False)


def request_new_password(prompt: Callable[[str], str] = getpass.getpass) -> str:
    password = prompt("Password: ")
    if len(password) < 6:
        raise BootstrapError("Password must contain at least 6 characters.")
    if password != prompt("Confirm password: "):
        raise BootstrapError("Password confirmation does not match.")
    return password


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="DEV/STAGING/ADMIN utility for safely provisioning one owner/shop mapping."
    )
    for name in ("project", "email", "shop-id", "shop-name", "owner-name", "phone", "address", "hours"):
        parser.add_argument(f"--{name}", required=True)
    parser.add_argument("--dry-run", action="store_true")
    parser.add_argument("--allow-non-staging-project", action="store_true")
    return parser


def run(args: argparse.Namespace, password_prompt: Callable[[str], str] = getpass.getpass) -> None:
    values = BootstrapInput(
        project=args.project.strip(), email=args.email.strip().lower(),
        shop_id=args.shop_id.strip(), shop_name=args.shop_name.strip(),
        owner_name=args.owner_name.strip(), phone=args.phone.strip(),
        address=args.address.strip(), hours=args.hours.strip(),
        allow_non_staging_project=args.allow_non_staging_project,
    )
    validate_inputs(values)
    import firebase_admin
    from firebase_admin import auth, firestore
    from google.cloud.firestore_v1.base_query import FieldFilter

    firebase_admin.initialize_app(options={"projectId": values.project})
    db = firestore.client()
    try:
        user = auth.get_user_by_email(values.email)
    except auth.UserNotFoundError:
        user = None
    owner_snapshot = db.collection("owners").document(user.uid).get() if user else None
    owner_data = owner_snapshot.to_dict() if owner_snapshot and owner_snapshot.exists else None
    shop_ref = db.collection("shops").document(values.shop_id)
    shop_snapshot = shop_ref.get()
    shop_data = shop_snapshot.to_dict() if shop_snapshot.exists else None
    mapped_uids = [
        snapshot.id
        for snapshot in db.collection("owners")
        .where(filter=FieldFilter("shopId", "==", values.shop_id))
        .stream()
    ]
    plan = evaluate_mapping_state(
        auth_uid=user.uid if user else None, owner_data=owner_data, shop_data=shop_data,
        shop_id=values.shop_id, mapped_uids=mapped_uids,
    )
    print(f"Preflight passed for project={values.project} shopId={values.shop_id} email={values.email}")
    print(f"Planned action: {plan.action}")
    if args.dry_run:
        print("Dry run complete; no Auth or Firestore writes performed.")
        return
    if not plan.create_owner and not plan.create_shop:
        print("Bootstrap already complete; no writes performed.")
        return
    created_auth_user = False
    if user is None:
        password = request_new_password(password_prompt)
        user = auth.create_user(email=values.email, password=password, display_name=values.owner_name)
        created_auth_user = True
    owner_ref = db.collection("owners").document(user.uid)
    batch = db.batch()
    now = firestore.SERVER_TIMESTAMP
    batch.set(owner_ref, {"shopId": values.shop_id, "email": values.email,
                          "displayName": values.owner_name, "role": "owner", "createdAt": now})
    batch.set(shop_ref, {"name": values.shop_name, "ownerUid": user.uid,
                         "ownerDisplayName": values.owner_name, "address": values.address,
                         "phone": values.phone, "businessHours": values.hours, "active": True,
                         "createdAt": now, "updatedAt": now, "createdBy": user.uid,
                         "updatedBy": user.uid, "deletedAt": None, "deletedBy": None})
    try:
        batch.commit()
    except Exception:
        if created_auth_user:
            auth.delete_user(user.uid)
        raise
    print(f"Owner and shop provisioned successfully for shopId={values.shop_id}.")


def main() -> None:
    run(build_parser().parse_args())


if __name__ == "__main__":
    main()
