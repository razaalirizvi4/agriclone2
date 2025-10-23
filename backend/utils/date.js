function pad(number) {
  return number.toString().padStart(2, '0');
}

function formatDateYYYYMMDD(input) {
  if (input == null) return undefined;
  const date = input instanceof Date ? input : new Date(input);
  if (isNaN(date.getTime())) return undefined;
  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  return `${year}-${month}-${day}`;
}

module.exports = {
  formatDateYYYYMMDD,
};


