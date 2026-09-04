export function PriceTag({ mrp, discountPrice }: { mrp: number; discountPrice?: number }) {
  const selling = discountPrice ?? mrp;
  const pct = discountPrice ? Math.round(((mrp - discountPrice) / mrp) * 100) : 0;
  return (
    <div className="flex flex-wrap items-baseline gap-2">
      <span className="text-xl font-bold text-primary">₹{selling.toLocaleString('en-IN')}</span>
      {discountPrice !== undefined && (
        <>
          <span className="text-sm text-muted-foreground line-through">
            ₹{mrp.toLocaleString('en-IN')}
          </span>
          <span className="text-sm font-semibold text-success">{pct}% off</span>
        </>
      )}
    </div>
  );
}
