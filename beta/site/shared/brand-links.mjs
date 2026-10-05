export function brandForProduct(catalog, slug, manufacturer) {
  const products = Array.isArray(catalog) ? catalog : [];
  return products.find(item => item.slug === slug)?.brand
    ?? products.find(item => item.brand?.toLocaleLowerCase() === manufacturer?.toLocaleLowerCase())?.brand
    ?? manufacturer;
}

export function brandListingHref(brand, listingBase = '../') {
  const params = new URLSearchParams({brand, sort: 'brand'});
  return `${listingBase}?${params}`;
}
