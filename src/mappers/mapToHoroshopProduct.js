export function mapToHoroshopProduct(product) {
    const quantity = Number.isFinite(product.qty) ? product.qty : 0;
    const imageLinks = Array.isArray(product.images) ? product.images.filter(Boolean) : [];

    return {
        article: product.sku || '',
        title: product.name || '',
        description: product.description || '',
        price: Number.isFinite(product.price) ? product.price : 0,
        oldprice: product.oldPrice != null ? product.oldPrice : undefined,
        currency: 'UAH',
        presence: quantity > 0 ? 'В наявності' : 'Немає в наявності',
        parent: product.category || '',
        brand: product.brand || '',
        images: {
            links: imageLinks,
            override: true
        },
        residues: [
            {
                warehouse: 'office',
                quantity
            }
        ],
        display_in_showcase: true,
        attributes: product.attributes || {}
    };
}