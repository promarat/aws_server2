export function paginationHelper(page, limit) {
  const getLimit = Number(limit) <= 0 || Number(limit) > 50 ? 50 : Number(limit);
  const getPage = Number(page);
  const offset = getPage === 1 || getPage <= 0 ? 0 : (getPage - 1) * getLimit;
  return { getLimit, getPage, offset };
}