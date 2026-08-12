const jmd = new Intl.NumberFormat('en-JM', {
  style: 'currency',
  currency: 'JMD',
  minimumFractionDigits: 2,
});

// en-JM formats JMD with a bare "$", which reads as USD outside Jamaica —
// prefix J for the unambiguous local form: J$13,111.11
export const formatMoney = (value) => 'J' + jmd.format(value);

export const formatDate = (iso) =>
  new Date(iso).toLocaleString('en-JM', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
