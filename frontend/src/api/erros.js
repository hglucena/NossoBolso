export function extrairErro(err, fallback) {
  const data = err.response?.data;
  if (!data) return fallback;
  if (typeof data.detail === "string") return data.detail;
  if (Array.isArray(data.non_field_errors)) return data.non_field_errors.join(" ");
  if (typeof data === "object") {
    const partes = Object.entries(data).map(([campo, erros]) =>
      `${campo}: ${Array.isArray(erros) ? erros.join(" ") : erros}`);
    if (partes.length) return partes.join(" | ");
  }
  return fallback;
}
