export function normalizeProduct(p) {
    console.log('p:>',p);
    const sku =
        p.vendorCode ||
        p.vendorcode ||
        p.vendor_code ||
        p.article ||
        p.sku ||
        p.SKU ||
        p.id ||
        p.ID ||
        p.barcode ||
        null;

    const name =
        p.name ||
        p.title ||
        p.model ||
        p['model-name'] ||
        p['product-name'] ||
        p.ProductName ||
        '';

    const brand = p.brand || p.Brand || p.producer || p.manufacturer || '';

    const priceRaw = p.price ?? p.Price ?? p['current-price'] ?? p['regular-price'] ?? p.cost;
    const price = priceRaw != null ? Number(String(priceRaw).replace(',', '.')) : null;

    const oldPrice = p.oldprice ?? p['old-price'] ?? p.OldPrice ?? null;

    function parseQty(value) {
        if (value == null) return null;
        if (typeof value === 'number' && Number.isFinite(value)) return value;

        const raw = String(value).trim().toLowerCase();

        if (!raw) return null;

        // убираем "шт", "шт.", лишние пробелы
        const cleaned = raw.replace(/шт\.?/gi, '').trim();

        // диапазон вида "10...50", "10 ... 50", "10-50"
        const rangeMatch = cleaned.match(/(\d+(?:[.,]\d+)?)\s*(?:\.\.\.|-|–|—)\s*(\d+(?:[.,]\d+)?)/);
        if (rangeMatch) {
            const left = Number(rangeMatch[1].replace(',', '.'));
            const right = Number(rangeMatch[2].replace(',', '.'));

            if (Number.isFinite(left) && Number.isFinite(right)) {
                return Math.min(left, right);
            }
        }

        // просто первое число
        const singleMatch = cleaned.match(/\d+(?:[.,]\d+)?/);
        if (singleMatch) {
            const num = Number(singleMatch[0].replace(',', '.'));
            return Number.isFinite(num) ? num : null;
        }

        return null;
    }

    const qty =
        p.ostatok != null
            ? parseQty(p.ostatok)
            : p.qty != null
                ? parseQty(p.qty)
                : p.stock != null
                    ? parseQty(p.stock)
                    : null;

    const available =
        p.available != null
            ? String(p.available).toLowerCase() === 'true' || p.available === 1 || p.available === '1'
            : qty != null
                ? qty > 0
                : undefined;

    let images = [];
    if (Array.isArray(p.picture)) images = p.picture;
    else if (p.pictures && Array.isArray(p.pictures.picture)) images = p.pictures.picture;
    else if (p.image) images = Array.isArray(p.image) ? p.image : [p.image];
    else if (p.imageurl) images = Array.isArray(p.imageurl) ? p.imageurl : [p.imageurl];
    else if (p.images && typeof p.images === 'string') images = p.images.split(',').map(s => s.trim());

    images = images.filter(Boolean);

    const category =
        p.category ||
        p['category-id'] ||
        p.category_name ||
        p.Category ||
        p.group ||
        '';

    const description =
        p.description ||
        p.full_description ||
        p['full-description'] ||
        p.desc ||
        '';

    const attributes = {};

    for (const key of ['length', 'width', 'height', 'weight', 'color', 'age', 'material']) {
        if (p[key] != null) attributes[key] = p[key];
    }

    if (p.l != null) attributes.length = attributes.length ?? p.l;
    if (p.w != null) attributes.width = attributes.width ?? p.w;
    if (p.h != null) attributes.height = attributes.height ?? p.h;
    if (p['weight-kg'] != null) attributes.weight = attributes.weight ?? p['weight-kg'];

    return {
        sku,
        name,
        brand,
        category,
        price,
        oldPrice,
        qty,
        available,
        images,
        description,
        attributes
    };
}