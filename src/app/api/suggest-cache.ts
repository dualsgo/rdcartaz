/**
 * Módulo de cache compartilhado para sugestões de produtos.
 * Permite que o módulo de POST (cadastro) invalide o cache do suggest
 * após salvar um novo produto.
 */
export let suggestCacheValid = true;

export function invalidateSuggestCache(): void {
    suggestCacheValid = false;
}

export function markSuggestCacheValid(): void {
    suggestCacheValid = true;
}
