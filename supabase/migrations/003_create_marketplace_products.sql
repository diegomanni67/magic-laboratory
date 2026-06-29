CREATE TABLE IF NOT EXISTS public.marketplace_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  type TEXT NOT NULL CHECK (type IN ('venta', 'canje')),
  price NUMERIC(10,2),
  trade_preference TEXT,
  image_url TEXT,
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.marketplace_products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Marketplace products are viewable by everyone"
ON public.marketplace_products
FOR SELECT
USING (true);

CREATE POLICY "Users can insert their own marketplace products"
ON public.marketplace_products
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own marketplace products"
ON public.marketplace_products
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own marketplace products"
ON public.marketplace_products
FOR DELETE
USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_marketplace_products_created_at ON public.marketplace_products(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_marketplace_products_type ON public.marketplace_products(type);
