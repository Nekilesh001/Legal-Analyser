"""
Report Generation Service — Generates a beautifully formatted PDF report of the contract analysis
using ReportLab, including Unicode Tamil font support, color-coded risk highlights,
and a mandatory disclaimer on every page.
"""
import io
import os
import logging
from datetime import datetime
from sqlalchemy.orm import Session

from reportlab.lib.pagesizes import A4
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Table, TableStyle, PageBreak, KeepTogether
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib import colors
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.pdfgen import canvas

from app.models.analysis import Analysis
from app.models.contract import Contract

logger = logging.getLogger(__name__)

# Register Tamil font for Unicode support (Latha is standard on Windows, fallback to standard Helvetica)
FONT_NAME = "Helvetica"
TAMIL_FONT_PATH = "C:\\Windows\\Fonts\\latha.ttf"

if os.path.exists(TAMIL_FONT_PATH):
    try:
        pdfmetrics.registerFont(TTFont("TamilFont", TAMIL_FONT_PATH))
        FONT_NAME = "TamilFont"
        logger.info("Tamil font (Latha) registered successfully for PDF generation.")
    except Exception as e:
        logger.warning(f"Failed to register Tamil font: {e}. Falling back to Helvetica.")
else:
    # On non-Windows / Docker environments, check default debian paths or use Helvetica
    linux_tamil_path = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf" # Fallback unicode
    if os.path.exists(linux_tamil_path):
        try:
            pdfmetrics.registerFont(TTFont("TamilFont", linux_tamil_path))
            FONT_NAME = "TamilFont"
        except Exception:
            pass


class NumberedCanvas(canvas.Canvas):
    """
    Custom canvas to perform two-pass rendering for total page count
    and draw header/footer on every page.
    """
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._saved_page_states = []

    def showPage(self):
        self._saved_page_states.append(dict(self.__dict__))
        self._startPage()

    def save(self):
        num_pages = len(self._saved_page_states)
        for state in self._saved_page_states:
            self.__dict__.update(state)
            self.draw_page_elements(num_pages)
            canvas.Canvas.showPage(self)
        canvas.Canvas.save(self)

    def draw_page_elements(self, page_count):
        self.saveState()
        
        # Header
        self.setFont(FONT_NAME, 8)
        self.setFillColor(colors.HexColor("#2A5F82"))
        self.drawString(36, 805, "LexClarity — Indian Legal Contract Intelligence Report")
        
        self.setStrokeColor(colors.HexColor("#41C0F2"))
        self.setLineWidth(0.5)
        self.line(36, 798, 559, 798)
        
        # Footer
        disclaimer = "⚖️ Disclaimer: This analysis is AI-generated and is for informational purposes only. It does not constitute legal advice."
        self.setFont(FONT_NAME, 7)
        self.setFillColor(colors.HexColor("#7F8C8D"))
        self.drawCentredString(297, 25, disclaimer)
        
        self.setFont(FONT_NAME, 8)
        self.drawRightString(559, 40, f"Page {self._pageNumber} of {page_count}")
        self.restoreState()


def generate_pdf_report(analysis_id: int, db: Session) -> bytes:
    """
    Generate a PDF report for a given analysis ID.
    Returns the PDF file contents as bytes.
    """
    analysis = db.query(Analysis).filter(Analysis.id == analysis_id).first()
    if not analysis:
        raise ValueError(f"Analysis with ID {analysis_id} not found.")

    contract = db.query(Contract).filter(Contract.id == analysis.contract_id).first()
    if not contract:
        raise ValueError(f"Contract with ID {analysis.contract_id} not found.")

    buffer = io.BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=A4,
        leftMargin=36,
        rightMargin=36,
        topMargin=54,
        bottomMargin=54
    )

    styles = getSampleStyleSheet()
    
    # Define custom typography matching glassmorphism colors
    primary_color = colors.HexColor("#0D518C")
    secondary_color = colors.HexColor("#41C0F2")
    text_dark = colors.HexColor("#0A2440")
    
    title_style = ParagraphStyle(
        'DocTitle',
        parent=styles['Heading1'],
        fontName=FONT_NAME,
        fontSize=22,
        leading=26,
        textColor=primary_color,
        spaceAfter=15
    )
    
    h2_style = ParagraphStyle(
        'DocH2',
        parent=styles['Heading2'],
        fontName=FONT_NAME,
        fontSize=14,
        leading=18,
        textColor=primary_color,
        spaceBefore=15,
        spaceAfter=8,
        keepWithNext=True
    )
    
    body_style = ParagraphStyle(
        'DocBody',
        parent=styles['BodyText'],
        fontName=FONT_NAME,
        fontSize=10,
        leading=14,
        textColor=text_dark
    )
    
    table_header_style = ParagraphStyle(
        'TableHeader',
        parent=body_style,
        fontName=FONT_NAME,
        fontSize=9,
        leading=11,
        textColor=colors.white,
        fontWeight='bold'
    )

    table_cell_style = ParagraphStyle(
        'TableCell',
        parent=body_style,
        fontSize=8.5,
        leading=11
    )

    table_cell_bold = ParagraphStyle(
        'TableCellBold',
        parent=table_cell_style,
        fontName=FONT_NAME,
        fontSize=8.5,
        leading=11,
        textColor=primary_color
    )

    story = []

    # Title
    story.append(Paragraph("LEXCLARITY CONTRACT ANALYSIS REPORT", title_style))
    story.append(Spacer(1, 10))

    # Metadata table
    metadata_data = [
        [Paragraph("<b>Contract Information</b>", ParagraphStyle('MetaHeader', parent=body_style, fontSize=11, textColor=primary_color)), ""],
        ["Contract File:", contract.filename],
        ["Contract Type:", (contract.contract_type or "other").upper()],
        ["Language Detected:", (contract.detected_language or "unknown").upper()],
        ["Analysis Date:", datetime.utcnow().strftime("%Y-%m-%d %H:%M UTC")],
        ["Health Score:", f"{analysis.health_score}%" if analysis.health_score is not None else "N/A"]
    ]
    meta_table = Table(metadata_data, colWidths=[130, 393])
    meta_table.setStyle(TableStyle([
        ('SPAN', (0, 0), (1, 0)),
        ('LINEBELOW', (0, 0), (1, 0), 1, primary_color),
        ('FONTNAME', (0, 1), (0, -1), FONT_NAME + '-Bold' if FONT_NAME != "TamilFont" else FONT_NAME),
        ('TEXTCOLOR', (0, 1), (0, -1), primary_color),
        ('PADDING', (0, 0), (-1, -1), 4),
        ('BOTTOMPADDING', (0, 0), (-1, 0), 8),
    ]))
    story.append(meta_table)
    story.append(Spacer(1, 20))

    # Summary cards (Health score & Bias)
    summary_data = [
        [
            Paragraph(f"<b>HEALTH SCORE: {analysis.health_score}%</b>", ParagraphStyle('ScoreP', parent=body_style, fontSize=12, textColor=colors.HexColor("#1E8E3E") if (analysis.health_score or 0) >= 75 else colors.HexColor("#D93025"))),
            Paragraph(f"<b>BIAS DISTRIBUTION</b>", ParagraphStyle('BiasP', parent=body_style, fontSize=12, textColor=primary_color))
        ],
        [
            Paragraph(
                f"High Risk Clauses: {analysis.high_risk_count}<br/>"
                f"Medium Risk Clauses: {analysis.medium_risk_count}<br/>"
                f"Low Risk Clauses: {analysis.low_risk_count}<br/>"
                f"Failed Clauses: {analysis.failed_clause_count}",
                body_style
            ),
            Paragraph(
                f"Favours Party A (Buyer): {analysis.bias_buyer_pct}%<br/>"
                f"Favours Party B (Vendor): {analysis.bias_vendor_pct}%<br/>"
                f"Neutral / Balanced: {analysis.bias_neutral_pct}%",
                body_style
            )
        ]
    ]
    summary_table = Table(summary_data, colWidths=[255, 268])
    summary_table.setStyle(TableStyle([
        ('BOX', (0, 0), (0, -1), 1, colors.HexColor("#BDC3C7")),
        ('BOX', (1, 0), (1, -1), 1, colors.HexColor("#BDC3C7")),
        ('BACKGROUND', (0, 0), (0, 0), colors.HexColor("#ECF0F1")),
        ('BACKGROUND', (1, 0), (1, 0), colors.HexColor("#ECF0F1")),
        ('PADDING', (0, 0), (-1, -1), 10),
        ('VALIGN', (0, 0), (-1, -1), 'TOP'),
    ]))
    story.append(summary_table)
    story.append(Spacer(1, 20))

    # Missing Clauses
    story.append(Paragraph("Missing Mandatory Clauses", h2_style))
    if analysis.missing_clauses:
        missing_data = [[
            Paragraph("<b>Requirement</b>", table_header_style),
            Paragraph("<b>Legal Reference</b>", table_header_style),
            Paragraph("<b>Severity</b>", table_header_style)
        ]]
        for mc in analysis.missing_clauses:
            sev_color = "#D93025" if mc.get("severity") == "critical" else "#F2994A"
            missing_data.append([
                Paragraph(mc.get("missing_requirement", "N/A"), table_cell_bold),
                Paragraph(mc.get("law_reference", "N/A"), table_cell_style),
                Paragraph(f"<font color='{sev_color}'><b>{mc.get('severity', 'recommended').upper()}</b></font>", table_cell_style)
            ])
        mc_table = Table(missing_data, colWidths=[240, 180, 103])
        mc_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), primary_color),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#BDC3C7")),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ]))
        story.append(mc_table)
    else:
        story.append(Paragraph("No missing mandatory clauses identified for this contract type.", body_style))
    story.append(Spacer(1, 20))

    # Negotiation Playbook
    story.append(Paragraph("Negotiation Playbook", h2_style))
    if analysis.negotiation_playbook:
        playbook_data = [[
            Paragraph("<b>Clause / Issue</b>", table_header_style),
            Paragraph("<b>Category</b>", table_header_style),
            Paragraph("<b>Recommendation / Guidance</b>", table_header_style)
        ]]
        for pb in analysis.negotiation_playbook:
            cat = pb.get("category", "negotiate")  # must_fix | negotiate | accept
            cat_label = "MUST FIX" if cat == "must_fix" else "NEGOTIATE" if cat == "negotiate" else "ACCEPT"
            cat_color = "#D93025" if cat == "must_fix" else "#F2994A" if cat == "negotiate" else "#27AE60"
            
            playbook_data.append([
                Paragraph(f"<b>Section: {pb.get('section_type', 'Clause')}</b><br/>{pb.get('clause_text', '')[:100]}...", table_cell_style),
                Paragraph(f"<font color='{cat_color}'><b>{cat_label}</b></font>", table_cell_style),
                Paragraph(
                    f"<b>Risk:</b> {pb.get('risk_reasoning', '')}<br/>"
                    f"<b>Alternative:</b> {pb.get('alternative_clause', 'N/A')}",
                    table_cell_style
                )
            ])
        pb_table = Table(playbook_data, colWidths=[150, 80, 293])
        pb_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), primary_color),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#BDC3C7")),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ]))
        story.append(pb_table)
    else:
        story.append(Paragraph("No playbook suggestions necessary for this contract.", body_style))
    story.append(Spacer(1, 25))

    # Page Break before full table to make layout clean
    story.append(PageBreak())

    # Full Clause Table
    story.append(Paragraph("Detailed Clause Analysis", h2_style))
    if analysis.clause_results:
        clause_data = [[
            Paragraph("<b>Clause Text</b>", table_header_style),
            Paragraph("<b>Section Type</b>", table_header_style),
            Paragraph("<b>Risk & Bias Analysis</b>", table_header_style)
        ]]
        for r in analysis.clause_results:
            if r.get("analysis_failed"):
                clause_data.append([
                    Paragraph(r.get("text", ""), table_cell_style),
                    Paragraph(r.get("section_type", "other"), table_cell_style),
                    Paragraph("<font color='#D93025'><b>Analysis Failed</b></font>", table_cell_style)
                ])
                continue

            risk = r.get("risk_level", "Low")
            risk_color = "#D93025" if risk == "High" else "#F2994A" if risk == "Medium" else "#27AE60"
            bias_lbl = r.get("bias_label", "neutral")
            bias_text = "Neutral" if bias_lbl == "neutral" else "Favours Buyer (Party A)" if bias_lbl == "favours_party_a" else "Favours Vendor (Party B)"
            
            risk_bias_info = (
                f"<b>Risk Level:</b> <font color='{risk_color}'><b>{risk}</b></font> (conf: {r.get('confidence', 0.0):.2f})<br/>"
                f"<b>Bias:</b> {bias_text} (conf: {r.get('bias_confidence', 0.0):.2f})<br/>"
                f"<b>Reasoning:</b> {r.get('risk_reasoning', '')}"
            )
            
            if r.get("alternative_clause"):
                risk_bias_info += f"<br/><b>Suggested Fair Alternative:</b> {r.get('alternative_clause')}"

            clause_data.append([
                Paragraph(r.get("text", ""), table_cell_style),
                Paragraph(r.get("section_type", "other"), table_cell_style),
                Paragraph(risk_bias_info, table_cell_style)
            ])
            
        c_table = Table(clause_data, colWidths=[180, 80, 263])
        c_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, 0), primary_color),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 6),
            ('TOPPADDING', (0, 0), (-1, -1), 6),
            ('GRID', (0, 0), (-1, -1), 0.5, colors.HexColor("#BDC3C7")),
            ('VALIGN', (0, 0), (-1, -1), 'TOP'),
        ]))
        story.append(c_table)
    else:
        story.append(Paragraph("No clauses found.", body_style))

    # Build the document
    doc.build(story, canvasmaker=NumberedCanvas)
    
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes
