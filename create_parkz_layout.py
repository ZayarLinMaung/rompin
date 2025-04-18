import xlsxwriter

# Create a new Excel workbook and worksheets
workbook = xlsxwriter.Workbook('PARKZ_ROMPIN_Layout.xlsx')
layout_sheet = workbook.add_worksheet('Unit Layout')
specs_sheet = workbook.add_worksheet('Unit Specifications')

# Define formats for different statuses
formats = {
    'ADVISE': workbook.add_format({'bg_color': '#90EE90', 'border': 1}),  # Light green
    'PRESENT': workbook.add_format({'bg_color': '#FFFF00', 'border': 1}),  # Yellow
    'LA SIGNED': workbook.add_format({'bg_color': '#FF69B4', 'border': 1}),  # Pink
    'SPA SIGNED': workbook.add_format({'bg_color': '#800080', 'border': 1}),  # Purple
    'LOAN APPROVED': workbook.add_format({'bg_color': '#FFA500', 'border': 1}),  # Orange
    'PENDING BUYER DOC': workbook.add_format({'bg_color': '#808080', 'border': 1}),  # Gray
    'LANDOWNER UNIT': workbook.add_format({'bg_color': '#0000FF', 'border': 1}),  # Blue
    'NEW BOOK': workbook.add_format({'bg_color': '#A52A2A', 'border': 1}),  # Brown
    'LOAN IN PROCESS': workbook.add_format({'bg_color': '#00FFFF', 'border': 1}),  # Light Blue
    'EMPTY': workbook.add_format({'bg_color': '#FFFFFF', 'border': 1}),  # White with border
    'HEADER': workbook.add_format({'bold': True, 'align': 'center', 'border': 1}),
    'PHASE': workbook.add_format({'bold': True, 'align': 'left', 'font_size': 12}),
    'PRICE': workbook.add_format({'num_format': 'RM #,##0.00', 'border': 1}),
    'SPEC_HEADER': workbook.add_format({'bold': True, 'align': 'center', 'border': 1, 'bg_color': '#D3D3D3'}),
    'SPEC_DATA': workbook.add_format({'align': 'center', 'border': 1})
}

# Set column widths for layout sheet
layout_sheet.set_column('A:Z', 8)

# Create legend
row = 1
layout_sheet.write(row, 0, 'Legend:', formats['HEADER'])
row += 1
for status, format in formats.items():
    if status not in ['EMPTY', 'HEADER', 'PHASE', 'PRICE', 'SPEC_HEADER', 'SPEC_DATA']:
        layout_sheet.write(row, 0, status, format)
        row += 1

# Start unit layout from row 1, column 5
current_row = 1

# Write phase headers
layout_sheet.write(current_row, 5, 'TERES FASA 1 (SL01-SL37)', formats['PHASE'])
current_row += 2

# Write unit numbers and status
# TERES FASA 1 (Units 1-37)
unit = 37
for i in range(3):  # 3 rows
    for j in range(12):  # 12 columns
        if unit > 0:
            cell_format = formats['ADVISE'] if unit in [1,2,3,4,5,6,7,8,9,10] else formats['EMPTY']
            layout_sheet.write(current_row, 5+j, f'SL{unit:02d}', cell_format)
        unit -= 1
    current_row += 1

current_row += 1
layout_sheet.write(current_row, 5, 'TERES FASA 2 (SL38-SL74)', formats['PHASE'])
current_row += 2

# TERES FASA 2 (Units 38-74)
unit = 74
for i in range(3):  # 3 rows
    for j in range(12):  # 12 columns
        if unit >= 38:
            cell_format = formats['LANDOWNER UNIT'] if unit in [75,76] else formats['EMPTY']
            layout_sheet.write(current_row, 5+j, f'SL{unit:02d}', cell_format)
        unit -= 1
    current_row += 1

current_row += 1
layout_sheet.write(current_row, 5, 'SEMI-D (SL75-SL98)', formats['PHASE'])
current_row += 2

# SEMI-D (Units 75-98)
unit = 98
for i in range(2):  # 2 rows
    for j in range(12):  # 12 columns
        if unit >= 75:
            cell_format = formats['EMPTY']
            layout_sheet.write(current_row, 5+j, f'SL{unit:02d}', cell_format)
        unit -= 1
    current_row += 1

# Add title to layout sheet
layout_sheet.merge_range('A1:N1', 'THE PARKZ ROMPIN', workbook.add_format({
    'bold': True,
    'font_size': 16,
    'align': 'center',
    'valign': 'vcenter'
}))

# Create Unit Specifications sheet
specs_sheet.set_column('A:A', 15)  # Type column
specs_sheet.set_column('B:G', 12)  # Other columns

# Add specifications title
specs_sheet.merge_range('A1:G1', 'UNIT SPECIFICATIONS AND PRICING', workbook.add_format({
    'bold': True,
    'font_size': 14,
    'align': 'center',
    'valign': 'vcenter',
    'border': 1
}))

# Add headers
headers = ['Type', 'Land Area', 'Built-up', 'Bedrooms', 'Bathrooms', 'Price (RM)', 'Units']
for col, header in enumerate(headers):
    specs_sheet.write(2, col, header, formats['SPEC_HEADER'])

# Add unit specifications
unit_specs = [
    ['TERES FASA 1', '20\' x 70\'', '1,400 sq.ft', '3', '2', 299000, 'SL01-SL37'],
    ['TERES FASA 2', '20\' x 70\'', '1,400 sq.ft', '3', '2', 309000, 'SL38-SL74'],
    ['SEMI-D', '40\' x 80\'', '2,200 sq.ft', '4', '3', 499000, 'SL75-SL98']
]

for row, spec in enumerate(unit_specs):
    for col, value in enumerate(spec):
        if col == 5:  # Price column
            specs_sheet.write(row + 3, col, value, formats['PRICE'])
        else:
            specs_sheet.write(row + 3, col, value, formats['SPEC_DATA'])

# Add notes
notes = [
    'Notes:',
    '* All prices are inclusive of land',
    '* Prices are subject to change without prior notice',
    '* Terms and conditions apply'
]

for i, note in enumerate(notes):
    specs_sheet.write(7 + i, 0, note, workbook.add_format({'bold': True if i == 0 else False}))

workbook.close() 