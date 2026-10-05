"""Dependency-free PDF and XLSX export for BuildTrack reports."""
from io import BytesIO
from html import escape
from zipfile import ZIP_DEFLATED, ZipFile


def _display(value):
    if value is None:
        return ""
    if isinstance(value, list):
        return ", ".join(_display(item) for item in value)
    if hasattr(value, "isoformat"):
        return value.isoformat()
    return str(value)


def _live_rows(report):
    data = report.get("data", [])
    headers = list(data[0].keys()) if data else []
    rows = [[_display(row.get(header)) for header in headers] for row in data]
    return headers, rows


def _escape_pdf(value):
    return value.encode("ascii", "replace").decode("ascii").replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)")


def _pdf_from_lines(lines):
    pages = [lines[index:index + 42] for index in range(0, len(lines), 42)] or [["BuildTrack Report"]]
    page_count = len(pages)
    font_number = 3 + page_count
    content_start = font_number + 1
    kids = " ".join(f"{3 + index} 0 R" for index in range(page_count))
    objects = [
        b"<< /Type /Catalog /Pages 2 0 R >>",
        f"<< /Type /Pages /Kids [{kids}] /Count {page_count} >>".encode(),
    ]
    for index in range(page_count):
        objects.append(f"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 842] /Resources << /Font << /F1 {font_number} 0 R >> >> /Contents {content_start + index} 0 R >>".encode())
    objects.append(b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>")
    for page in pages:
        stream = "BT /F1 9 Tf 36 806 Td " + " ".join(f"({_escape_pdf(line[:110])}) Tj 0 -18 Td" for line in page) + " ET"
        objects.append(f"<< /Length {len(stream.encode())} >>\nstream\n{stream}\nendstream".encode())
    output = BytesIO(); output.write(b"%PDF-1.4\n"); offsets = [0]
    for number, obj in enumerate(objects, 1):
        offsets.append(output.tell()); output.write(f"{number} 0 obj\n".encode()); output.write(obj); output.write(b"\nendobj\n")
    xref = output.tell(); output.write(f"xref\n0 {len(objects)+1}\n0000000000 65535 f \n".encode())
    for offset in offsets[1:]: output.write(f"{offset:010d} 00000 n \n".encode())
    output.write(f"trailer << /Size {len(objects)+1} /Root 1 0 R >>\nstartxref\n{xref}\n%%EOF".encode())
    return output.getvalue()


def _column_name(index):
    result = ""
    while index >= 0:
        result = chr(index % 26 + 65) + result
        index = index // 26 - 1
    return result


def _xlsx_from_rows(rows):
    cells = []
    for r_index, row in enumerate(rows, 1):
        pieces = []
        for c_index, value in enumerate(row):
            cell = f"{_column_name(c_index)}{r_index}"
            pieces.append(f'<c r="{cell}" t="inlineStr"><is><t>{escape(_display(value))}</t></is></c>')
        cells.append(f'<row r="{r_index}">{"".join(pieces)}</row>')
    sheet = f'<?xml version="1.0" encoding="UTF-8"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>{"".join(cells)}</sheetData></worksheet>'
    files = {
        "[Content_Types].xml": '<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>',
        "_rels/.rels": '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>',
        "xl/workbook.xml": '<?xml version="1.0" encoding="UTF-8"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="BuildTrack Report" sheetId="1" r:id="rId1"/></sheets></workbook>',
        "xl/_rels/workbook.xml.rels": '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>',
        "xl/worksheets/sheet1.xml": sheet,
    }
    result = BytesIO()
    with ZipFile(result, "w", ZIP_DEFLATED) as archive:
        for name, content in files.items(): archive.writestr(name, content)
    return result.getvalue()


def _rows(report):
    values = report.content_json or {}
    return [["Field", "Value"], *[[str(key), str(value)] for key, value in values.items()]]


def _pdf(report):
    lines = [report.title, f"Report type: {report.report_type}", f"Created: {report.created_at}"]
    lines.extend(f"{key}: {value}" for key, value in (report.content_json or {}).items())
    clean = [line.encode("ascii", "replace").decode("ascii")[:140] for line in lines]
    stream = "BT /F1 11 Tf 50 790 Td " + " ".join(f"({line.replace(chr(92), chr(92)*2).replace('(', chr(92)+'(').replace(')', chr(92)+')')}) Tj 0 -18 Td" for line in clean) + " ET"
    objects = [b"<< /Type /Catalog /Pages 2 0 R >>", b"<< /Type /Pages /Kids [3 0 R] /Count 1 >>", b"<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>", b"<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>", f"<< /Length {len(stream.encode())} >>\nstream\n{stream}\nendstream".encode()]
    output = BytesIO(); output.write(b"%PDF-1.4\n"); offsets = [0]
    for number, obj in enumerate(objects, 1):
        offsets.append(output.tell()); output.write(f"{number} 0 obj\n".encode()); output.write(obj); output.write(b"\nendobj\n")
    xref = output.tell(); output.write(f"xref\n0 {len(objects)+1}\n0000000000 65535 f \n".encode())
    for offset in offsets[1:]: output.write(f"{offset:010d} 00000 n \n".encode())
    output.write(f"trailer << /Size {len(objects)+1} /Root 1 0 R >>\nstartxref\n{xref}\n%%EOF".encode())
    return output.getvalue()


def _xlsx(report):
    rows = _rows(report)
    cells = []
    for r_index, row in enumerate(rows, 1):
        pieces = []
        for c_index, value in enumerate(row):
            col = "A" if c_index == 0 else "B"
            pieces.append(f'<c r="{col}{r_index}" t="inlineStr"><is><t>{escape(value)}</t></is></c>')
        cells.append(f'<row r="{r_index}">{"".join(pieces)}</row>')
    sheet = f'<?xml version="1.0" encoding="UTF-8"?><worksheet xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main"><sheetData>{"".join(cells)}</sheetData></worksheet>'
    files = {
        "[Content_Types].xml": '<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/xl/workbook.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet.main+xml"/><Override PartName="/xl/worksheets/sheet1.xml" ContentType="application/vnd.openxmlformats-officedocument.spreadsheetml.worksheet+xml"/></Types>',
        "_rels/.rels": '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="xl/workbook.xml"/></Relationships>',
        "xl/workbook.xml": '<?xml version="1.0" encoding="UTF-8"?><workbook xmlns="http://schemas.openxmlformats.org/spreadsheetml/2006/main" xmlns:r="http://schemas.openxmlformats.org/officeDocument/2006/relationships"><sheets><sheet name="BuildTrack Report" sheetId="1" r:id="rId1"/></sheets></workbook>',
        "xl/_rels/workbook.xml.rels": '<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/worksheet" Target="worksheets/sheet1.xml"/></Relationships>',
        "xl/worksheets/sheet1.xml": sheet,
    }
    result = BytesIO()
    with ZipFile(result, "w", ZIP_DEFLATED) as archive:
        for name, content in files.items(): archive.writestr(name, content)
    return result.getvalue()


def export_report_bytes(report, fmt):
    if fmt == "pdf":
        return _pdf(report), "application/pdf", "pdf"
    return _xlsx(report), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "xlsx"


def export_live_report_bytes(report, fmt):
    title = report["report_type"].replace("-", " ").title()
    headers, data_rows = _live_rows(report)
    if fmt == "pdf":
        lines = ["BuildTrack", f"{title} Report", f"Generated: {_display(report['generated_at'])}"]
        if report["filters"]:
            lines.extend(["Applied filters:", *[f"  {key}: {_display(value)}" for key, value in report["filters"].items()]])
        lines.extend(["Summary:", *[f"  {key}: {_display(value)}" for key, value in report["summary"].items()]])
        lines.append("Report data:")
        if headers:
            lines.append(" | ".join(header.replace("_", " ").title() for header in headers))
            lines.extend(" | ".join(row) for row in data_rows)
        else:
            lines.append("No records found for the selected filters.")
        return _pdf_from_lines(lines), "application/pdf", "pdf"
    worksheet_rows = [["BuildTrack", f"{title} Report"], ["Generated", _display(report["generated_at"])], []]
    worksheet_rows.extend([[f"Filter: {key}", _display(value)] for key, value in report["filters"].items()])
    worksheet_rows.append([])
    worksheet_rows.extend([[f"Summary: {key}", _display(value)] for key, value in report["summary"].items()])
    worksheet_rows.extend([[], [header.replace("_", " ").title() for header in headers], *data_rows])
    return _xlsx_from_rows(worksheet_rows), "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "xlsx"
