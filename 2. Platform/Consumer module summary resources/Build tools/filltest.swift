import PDFKit
let a = CommandLine.arguments
let doc = PDFDocument(url: URL(fileURLWithPath: a[1]))!
var n = 0
for i in 0..<doc.pageCount { for ann in doc.page(at: i)!.annotations where ann.widgetFieldType == .text {
  ann.widgetStringValue = "Test answer for \(ann.fieldName ?? "?"): I wake up two or three times most nights and find it hard to get back to sleep. This line is long on purpose to check wrapping."
  n += 1 } }
doc.write(to: URL(fileURLWithPath: a[2]))
let back = PDFDocument(url: URL(fileURLWithPath: a[2]))!
var ok = 0
for i in 0..<back.pageCount { for ann in back.page(at: i)!.annotations where ann.widgetFieldType == .text {
  let v = ann.widgetStringValue ?? ""; if v.hasPrefix("Test answer for") { ok += 1 }
  print("p\(i+1) \(ann.fieldName ?? "?") multiline=\(ann.isMultiline) readOnly=\(ann.isReadOnly) saved=\(v.prefix(30))") } }
print("filled \(n), read back after save+reopen \(ok)")
