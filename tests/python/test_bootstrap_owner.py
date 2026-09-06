from __future__ import annotations
import importlib.util
import pathlib
import sys
import unittest

SCRIPT = pathlib.Path(__file__).parents[2] / "scripts" / "bootstrap_owner.py"
SPEC = importlib.util.spec_from_file_location("bootstrap_owner", SCRIPT)
assert SPEC and SPEC.loader
bootstrap = importlib.util.module_from_spec(SPEC)
sys.modules[SPEC.name] = bootstrap
SPEC.loader.exec_module(bootstrap)


def valid_input(**overrides: object):
    values = {"project": "agriconnect-staging", "email": "agriconnect-staging-owner@example.com",
              "shop_id": "demo-shop", "shop_name": "AgriConnect Demo Shop",
              "owner_name": "AgriConnect Staging Owner", "phone": "+919999900001",
              "address": "1 Staging Test Road, Demo Village",
              "hours": "Mon-Sat, 8 AM - 7 PM", "allow_non_staging_project": False}
    values.update(overrides)
    return bootstrap.BootstrapInput(**values)


class ValidationTests(unittest.TestCase):
    def test_accepts_staging_input(self):
        bootstrap.validate_inputs(valid_input())

    def test_rejects_production_project_by_default(self):
        with self.assertRaisesRegex(bootstrap.BootstrapError, "not recognizable as staging/test"):
            bootstrap.validate_inputs(valid_input(project="agriconnect-prod"))

    def test_allows_explicit_non_staging_override(self):
        bootstrap.validate_inputs(valid_input(project="agriconnect-prod", allow_non_staging_project=True))

    def test_rejects_invalid_fields(self):
        with self.assertRaises(bootstrap.BootstrapError):
            bootstrap.validate_inputs(valid_input(email="bad", phone="123", shop_id="Invalid Shop"))


class MappingTests(unittest.TestCase):
    def test_empty_state_plans_creation(self):
        plan = bootstrap.evaluate_mapping_state(auth_uid=None, owner_data=None, shop_data=None,
                                                shop_id="demo-shop", mapped_uids=[])
        self.assertTrue(plan.create_owner and plan.create_shop)

    def test_consistent_mapping_is_idempotent(self):
        plan = bootstrap.evaluate_mapping_state(
            auth_uid="owner-1", owner_data={"shopId": "demo-shop", "role": "owner"},
            shop_data={"ownerUid": "owner-1"}, shop_id="demo-shop", mapped_uids=["owner-1"])
        self.assertFalse(plan.create_owner or plan.create_shop)

    def test_partial_and_cross_owner_mappings_are_rejected(self):
        with self.assertRaises(bootstrap.BootstrapError):
            bootstrap.evaluate_mapping_state(
                auth_uid="owner-1", owner_data={"shopId": "demo-shop", "role": "owner"},
                shop_data=None, shop_id="demo-shop", mapped_uids=["owner-1"])
        with self.assertRaises(bootstrap.BootstrapError):
            bootstrap.evaluate_mapping_state(
                auth_uid="owner-1", owner_data={"shopId": "demo-shop", "role": "owner"},
                shop_data={"ownerUid": "owner-2"}, shop_id="demo-shop", mapped_uids=["owner-2"])


class PasswordTests(unittest.TestCase):
    def test_hidden_password_requires_confirmation(self):
        prompts = iter(["safe-password", "safe-password"])
        self.assertEqual(bootstrap.request_new_password(lambda _: next(prompts)), "safe-password")

    def test_parser_has_dry_run_but_no_password_argument(self):
        parser = bootstrap.build_parser()
        options = {o for action in parser._actions for o in action.option_strings}
        self.assertIn("--dry-run", options)
        self.assertNotIn("--password", options)


if __name__ == "__main__":
    unittest.main()
