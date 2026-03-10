import { NextResponse } from 'next/server'

export async function GET(request) {
  const { searchParams } = new URL(request.url)
  const barcode = searchParams.get('barcode')

  if (!barcode) {
    return NextResponse.json({ error: 'Missing barcode' }, { status: 400 })
  }

  try {
    const res = await fetch(
      `https://world.openfoodfacts.org/api/v0/product/${barcode}.json`,
      {
        headers: { 'User-Agent': 'PantryApp/1.0 (contact@kinnaird.dev)' },
        next: { revalidate: 86400 }, // cache for 24h
      }
    )
    const data = await res.json()

    if (data.status !== 1 || !data.product) {
      return NextResponse.json({ found: false })
    }

    const p = data.product
    return NextResponse.json({
      found: true,
      name: p.product_name || p.product_name_en || '',
      brand: p.brands || '',
      image_url: p.image_front_small_url || p.image_url || '',
      quantity: p.quantity || '',       // e.g. "500g" — informational only
    })
  } catch {
    return NextResponse.json({ found: false })
  }
}
