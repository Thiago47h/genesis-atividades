export function buildWordHeader({ logoDataUrl, title, subtitle = "", showGrade = false }) {
  const safeTitle = String(title || "").toUpperCase();
  const safeSubtitle = String(subtitle || "");
  const nameWidth = showGrade ? "68%" : "84%";
  const numberWidth = showGrade ? "12%" : "16%";

  return `
<table width="100%" cellpadding="0" cellspacing="4" style="border-collapse:separate;border-spacing:4px;margin:0 0 2px 0;">
  <tr>
    <td rowspan="2" width="105" style="border:1.5px solid #8D8D8D;border-radius:14px;text-align:center;vertical-align:middle;padding:8px;background:#FFFFFF;">
      <img src="${logoDataUrl}" width="82" alt="Logo do Colégio Gênesis Life" style="display:block;margin:0 auto;"/>
    </td>
    <td style="border:1.5px solid #8D8D8D;border-radius:14px;text-align:center;vertical-align:middle;padding:12px 10px;background:#FFFFFF;font-size:16pt;font-weight:bold;letter-spacing:.4px;color:#231F20;">
      COLÉGIO GÊNESIS LIFE
    </td>
  </tr>
  <tr>
    <td style="border:1.5px solid #8D8D8D;border-radius:14px;text-align:center;vertical-align:middle;padding:10px;background:#FFFFFF;font-size:13pt;font-weight:bold;letter-spacing:.3px;color:#231F20;">
      ${safeTitle}
      ${safeSubtitle ? `<div style="font-size:9.5pt;font-weight:normal;color:#555;margin-top:3px;">${safeSubtitle}</div>` : ""}
    </td>
  </tr>
</table>

<table width="100%" cellpadding="0" cellspacing="4" style="border-collapse:separate;border-spacing:4px;margin:0 0 2px 0;">
  <tr>
    <td width="28%" style="height:34px;border:1.5px solid #8D8D8D;border-radius:12px;padding:7px 10px;font-size:10.5pt;vertical-align:top;"><strong>Data:</strong> ____/____/________</td>
    <td width="22%" style="height:34px;border:1.5px solid #8D8D8D;border-radius:12px;padding:7px 10px;font-size:10.5pt;vertical-align:top;"><strong>Turma:</strong></td>
    <td width="50%" style="height:34px;border:1.5px solid #8D8D8D;border-radius:12px;padding:7px 10px;font-size:10.5pt;vertical-align:top;"><strong>Prof.ª:</strong></td>
  </tr>
</table>

<table width="100%" cellpadding="0" cellspacing="4" style="border-collapse:separate;border-spacing:4px;margin:0 0 16px 0;">
  <tr>
    <td width="${nameWidth}" style="height:36px;border:1.5px solid #8D8D8D;border-radius:12px;padding:7px 10px;font-size:10.5pt;vertical-align:top;"><strong>Nome:</strong></td>
    <td width="${numberWidth}" style="height:36px;border:1.5px solid #8D8D8D;border-radius:12px;padding:7px 10px;font-size:10.5pt;vertical-align:top;text-align:center;"><strong>Nº:</strong></td>
    ${showGrade ? '<td width="20%" style="height:36px;border:1.5px solid #8D8D8D;border-radius:12px;padding:7px 10px;font-size:10.5pt;vertical-align:top;text-align:center;"><strong>Nota:</strong></td>' : ""}
  </tr>
</table>`;
}
