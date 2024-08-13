exports.pagination = (totalItems, limit, page) => {
  return {
    totalItems: parseInt(totalItems),
    totalPages: parseInt(Math.ceil(totalItems / limit)),
    currentPage: parseInt(page),
  };
};
