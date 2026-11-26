import json, sys
from pypdf import PdfReader, PdfWriter
from pypdf.generic import (DictionaryObject, NameObject, TextStringObject, NumberObject, ArrayObject,
                           FloatObject, BooleanObject, StreamObject)
src, dst, fields_json = sys.argv[1], sys.argv[2], sys.argv[3]
outline_json = sys.argv[4] if len(sys.argv) > 4 else None
fields = json.load(open(fields_json))
r = PdfReader(src); w = PdfWriter(clone_from=r)
font = w._add_object(DictionaryObject({NameObject('/Type'): NameObject('/Font'), NameObject('/Subtype'): NameObject('/Type1'),
        NameObject('/BaseFont'): NameObject('/Helvetica'), NameObject('/Encoding'): NameObject('/WinAnsiEncoding')}))
DA = TextStringObject('/Helv 12 Tf 0.102 0.102 0.102 rg')   # ink #1a1a1a, 12pt
field_refs = ArrayObject()
for f in fields:
    page = w.pages[f['page']]
    W = float(page.mediabox.width); H = float(page.mediabox.height); k = W / 595.28   # Chrome's sheet is a hair under 595.28
    x1 = f['x'] * k; x2 = (f['x'] + f['w']) * k
    y2 = H - f['top'] * k; y1 = H - (f['top'] + f['h']) * k
    ap = StreamObject(); ap[NameObject('/Type')] = NameObject('/XObject'); ap[NameObject('/Subtype')] = NameObject('/Form')
    ap[NameObject('/BBox')] = ArrayObject([FloatObject(0), FloatObject(0), FloatObject(x2 - x1), FloatObject(y2 - y1)])
    ap.set_data(b'/Tx BMC EMC')
    widget = DictionaryObject({
        NameObject('/Type'): NameObject('/Annot'), NameObject('/Subtype'): NameObject('/Widget'),
        NameObject('/FT'): NameObject('/Tx'), NameObject('/T'): TextStringObject(f['name']),
        NameObject('/TU'): TextStringObject(f['q']),
        NameObject('/Rect'): ArrayObject([FloatObject(round(v, 2)) for v in (x1, y1, x2, y2)]),
        NameObject('/F'): NumberObject(4),                       # print
        NameObject('/Ff'): NumberObject(4096),                   # multiline (scrolling allowed, so a long answer is never cut off)
        NameObject('/DA'): DA, NameObject('/Q'): NumberObject(0),
        NameObject('/MK'): DictionaryObject(),                   # no border, no fill: the printed lines show through
        NameObject('/P'): page.indirect_reference,
        NameObject('/AP'): DictionaryObject({NameObject('/N'): w._add_object(ap)}),
    })
    ref = w._add_object(widget)
    if '/Annots' not in page: page[NameObject('/Annots')] = ArrayObject()
    page['/Annots'].append(ref); field_refs.append(ref)
w._root_object[NameObject('/AcroForm')] = DictionaryObject({
    NameObject('/Fields'): field_refs, NameObject('/DA'): DA,
    NameObject('/DR'): DictionaryObject({NameObject('/Font'): DictionaryObject({NameObject('/Helv'): font})}),
    NameObject('/NeedAppearances'): BooleanObject(True)})
w._root_object[NameObject('/ViewerPreferences')] = DictionaryObject({NameObject('/DisplayDocTitle'): BooleanObject(True)})
w.add_metadata({'/Title': 'Building Blocks of Good Sleep', '/Subject': 'Care2Sleep Module 1 resource',
                '/Author': 'Care2Sleep, Monash University', '/Creator': 'Care2Sleep consumer module resources'})
# bookmarks: the contents page's sections, not Chrome's heading dump
if outline_json:
    if '/Outlines' in w._root_object: del w._root_object['/Outlines']
    for item in json.load(open(outline_json)):
        parent = w.add_outline_item(item['title'], item['page'])
        for c in item.get('children', []): w.add_outline_item(c['title'], c['page'], parent=parent)
    w._root_object[NameObject('/PageMode')] = NameObject('/UseOutlines')
w.compress_identical_objects()
w.write(dst); print('fields', len(field_refs))
