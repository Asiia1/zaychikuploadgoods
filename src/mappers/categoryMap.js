/**
 * Маппінг категорій постачальника → категорії на сайті Хорошоп.
 *
 * Ключ   — назва категорії як вона приходить від постачальника (регістронезалежно).
 * Значення — повний шлях категорії на сайті через роздільник Хорошоп «: »
 *             (Батько: Дитина: Онук).
 *
 * Якщо категорія не знайдена в таблиці — залишається без змін.
 */
export const CATEGORY_MAP = {
    'літо': 'Сезонні товари: Літо',
};

/**
 * Повертає категорію для Хорошоп.
 * Якщо є маппінг — повертає mapped-значення, інакше — оригінальний рядок.
 *
 * @param {string} supplierCategory
 * @returns {string}
 */
export function mapCategory(supplierCategory) {
    if (!supplierCategory) return '';
    const key = supplierCategory.trim().toLowerCase();
    return CATEGORY_MAP[key] ?? supplierCategory;
}
