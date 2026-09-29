from pathlib import Path
import re

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    PageBreak,
)

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "docs" / "commission-documentation.md"
OUTPUT = ROOT / "docs" / "commission-documentation.pdf"
FONT_DIR = Path("/System/Library/Fonts/Supplemental")

pdfmetrics.registerFont(TTFont("Arial", str(FONT_DIR / "Arial.ttf")))
pdfmetrics.registerFont(TTFont("Arial-Bold", str(FONT_DIR / "Arial Bold.ttf")))

styles = getSampleStyleSheet()
styles.add(ParagraphStyle(name="TitleRu", parent=styles["Title"], fontName="Arial-Bold", fontSize=23, leading=28, textColor=colors.HexColor("#172554"), alignment=TA_CENTER, spaceAfter=10))
styles.add(ParagraphStyle(name="SubtitleRu", parent=styles["Normal"], fontName="Arial", fontSize=10, leading=14, textColor=colors.HexColor("#52627a"), alignment=TA_CENTER, spaceAfter=18))
styles.add(ParagraphStyle(name="H1Ru", parent=styles["Heading1"], fontName="Arial-Bold", fontSize=16, leading=20, textColor=colors.HexColor("#172554"), spaceBefore=14, spaceAfter=7, keepWithNext=True))
styles.add(ParagraphStyle(name="H2Ru", parent=styles["Heading2"], fontName="Arial-Bold", fontSize=12, leading=15, textColor=colors.HexColor("#304b91"), spaceBefore=9, spaceAfter=5, keepWithNext=True))
styles.add(ParagraphStyle(name="BodyRu", parent=styles["BodyText"], fontName="Arial", fontSize=9.2, leading=13.2, textColor=colors.HexColor("#222b3a"), spaceAfter=5))
styles.add(ParagraphStyle(name="SmallRu", parent=styles["BodyText"], fontName="Arial", fontSize=7.5, leading=9.5, textColor=colors.HexColor("#222b3a")))
styles.add(ParagraphStyle(name="CodeRu", parent=styles["BodyText"], fontName="Arial", fontSize=8.2, leading=11, backColor=colors.HexColor("#f0f4fa"), borderPadding=5, leftIndent=5, rightIndent=5, spaceBefore=3, spaceAfter=7))

def clean(text: str) -> str:
    text = text.replace("—", "-").replace("–", "-").replace("‑", "-")
    text = text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    text = re.sub(r"`([^`]+)`", r"<font name='Arial-Bold'>\1</font>", text)
    text = re.sub(r"\*\*([^*]+)\*\*", r"<b>\1</b>", text)
    text = re.sub(r"\[([^]]+)\]\([^)]*\)", r"\1", text)
    return text

def p(text, style="BodyRu"):
    return Paragraph(clean(text), styles[style])

class CommissionDoc(BaseDocTemplate):
    def __init__(self, filename):
        super().__init__(filename, pagesize=A4, leftMargin=17*mm, rightMargin=17*mm, topMargin=16*mm, bottomMargin=16*mm, title="Документация FunnyMoney для комиссии хакатона")
        frame = Frame(self.leftMargin, self.bottomMargin, self.width, self.height, id="normal")
        self.addPageTemplates([PageTemplate(id="commission", frames=frame, onPage=self.decorate)])

    def decorate(self, canvas, doc):
        canvas.saveState()
        canvas.setStrokeColor(colors.HexColor("#dbe4f0"))
        canvas.line(doc.leftMargin, 11*mm, A4[0] - doc.rightMargin, 11*mm)
        canvas.setFont("Arial", 7.5)
        canvas.setFillColor(colors.HexColor("#718096"))
        canvas.drawString(doc.leftMargin, 7*mm, "FunnyMoney - документация для комиссии")
        canvas.drawRightString(A4[0] - doc.rightMargin, 7*mm, f"Страница {doc.page}")
        canvas.restoreState()

def read_blocks():
    lines = SOURCE.read_text(encoding="utf-8").splitlines()
    blocks, i = [], 0
    while i < len(lines):
        line = lines[i]
        if not line.strip():
            i += 1
            continue
        if line.startswith("```"):
            code = []
            i += 1
            while i < len(lines) and not lines[i].startswith("```"):
                code.append(lines[i]); i += 1
            i += 1
            blocks.append(("code", "\n".join(code)))
            continue
        if line.startswith("|"):
            rows = []
            while i < len(lines) and lines[i].startswith("|"):
                row = [cell.strip() for cell in lines[i].strip().strip("|").split("|")]
                if not all(set(cell) <= set("-: ") for cell in row): rows.append(row)
                i += 1
            blocks.append(("table", rows))
            continue
        if line.startswith("# "): blocks.append(("title", line[2:])); i += 1; continue
        if line.startswith("## "): blocks.append(("h1", line[3:])); i += 1; continue
        if line.startswith("### "): blocks.append(("h2", line[4:])); i += 1; continue
        if line.startswith("- ") or re.match(r"\d+\. ", line):
            items = []
            while i < len(lines) and (lines[i].startswith("- ") or re.match(r"\d+\. ", lines[i])):
                items.append(re.sub(r"^(?:- |\d+\. )", "", lines[i])); i += 1
            blocks.append(("list", items)); continue
        para = [line]; i += 1
        while i < len(lines) and lines[i].strip() and not lines[i].startswith(("#", "|", "```", "- ")) and not re.match(r"\d+\. ", lines[i]):
            para.append(lines[i]); i += 1
        blocks.append(("para", " ".join(para)))
    return blocks

def build():
    story = []
    for kind, value in read_blocks():
        if kind == "title":
            story += [p(value, "TitleRu"), p("Версия для комиссии хакатона", "SubtitleRu")]
        elif kind == "h1": story += [p(value, "H1Ru")]
        elif kind == "h2": story += [p(value, "H2Ru")]
        elif kind == "para": story += [p(value), Spacer(1, 2)]
        elif kind == "code": story += [p(value.replace("\n", "<br/>"), "CodeRu")]
        elif kind == "list":
            for item in value: story.append(p("- " + item))
            story.append(Spacer(1, 3))
        elif kind == "table":
            data = [[Paragraph(clean(cell), styles["SmallRu"]) for cell in row] for row in value]
            widths = [doc_width / len(data[0])] * len(data[0]) if data else []
            table = Table(data, colWidths=widths, repeatRows=1, hAlign="LEFT")
            table.setStyle(TableStyle([
                ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#e8eef9")),
                ("TEXTCOLOR", (0, 0), (-1, 0), colors.HexColor("#172554")),
                ("GRID", (0, 0), (-1, -1), 0.35, colors.HexColor("#cad5e5")),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 5), ("RIGHTPADDING", (0, 0), (-1, -1), 5),
                ("TOPPADDING", (0, 0), (-1, -1), 4), ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
            ]))
            story += [table, Spacer(1, 7)]
    CommissionDoc(str(OUTPUT)).build(story)

doc_width = A4[0] - 34*mm
if __name__ == "__main__":
    build()
