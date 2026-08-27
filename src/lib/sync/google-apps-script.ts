export const APPS_SCRIPT_TEMPLATE = `
// HiNix Google Sheets Sync Script
// Deploy this as a Web App (Execute as: Me, Who has access: Anyone)

const SCRIPT_VERSION = "1.0";

function doGet(e) {
  return handleRequest(e, "GET");
}

function doPost(e) {
  return handleRequest(e, "POST");
}

function handleRequest(e, method) {
  try {
    const action = e.parameter.action;
    
    if (method === "GET" && action === "pull") {
      const sheetName = e.parameter.sheet;
      if (!sheetName) throw new Error("Missing sheet parameter");
      
      const ss = SpreadsheetApp.getActiveSpreadsheet();
      let sheet = ss.getSheetByName(sheetName);
      if (!sheet) return jsonResponse([]);
      
      const data = sheet.getDataRange().getValues();
      if (data.length <= 1) return jsonResponse([]); // Only headers or empty
      
      const headers = data[0];
      const rows = data.slice(1).map(row => {
        let obj = {};
        headers.forEach((header, i) => {
          if (header && row[i] !== "") {
            try {
              // Try parsing JSON for complex objects (like completions), otherwise keep string/number
              const val = row[i];
              if (typeof val === 'string' && (val.startsWith('{') || val.startsWith('['))) {
                obj[header] = JSON.parse(val);
              } else {
                obj[header] = val;
              }
            } catch (err) {
              obj[header] = row[i];
            }
          }
        });
        return obj;
      });
      
      return jsonResponse(rows);
    }
    
    if (method === "POST" && e.postData && e.postData.contents) {
      const body = JSON.parse(e.postData.contents);
      
      if (body.action === "upsert") {
        return handleUpsert(body.sheet, body.row);
      }
      
      if (body.action === "delete") {
        return handleDelete(body.sheet, body.id);
      }
      
      if (body.action === "pushAll") {
        return handlePushAll(body.sheet, body.rows);
      }
    }
    
    throw new Error("Invalid action or method");
  } catch (error) {
    return jsonResponse({ error: error.message }, 400);
  }
}

function handleUpsert(sheetName, rowObj) {
  const sheet = getOrCreateSheet(sheetName, Object.keys(rowObj));
  const data = sheet.getDataRange().getValues();
  let headers = data[0];
  
  let headersChanged = false;
  Object.keys(rowObj).forEach(key => {
    if (!headers.includes(key)) {
      headers.push(key);
      headersChanged = true;
    }
  });

  if (headersChanged) {
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#f3f3f3");
  }
  
  // Find row by id
  let rowIndex = -1;
  const idColIndex = headers.indexOf("id");
  if (idColIndex === -1) throw new Error("Sheet missing 'id' column");
  
  if (data.length > 1) {
    for (let i = 1; i < data.length; i++) {
      if (data[i][idColIndex] === rowObj.id) {
        rowIndex = i + 1; // 1-based index, +1 for header
        break;
      }
    }
  }
  
  // Convert object to row array
  const rowData = headers.map(header => {
    let val = rowObj[header];
    if (val === undefined || val === null) return "";
    if (typeof val === "object") return JSON.stringify(val); // Serialize objects
    return val;
  });
  
  if (rowIndex > -1) {
    // Update
    sheet.getRange(rowIndex, 1, 1, rowData.length).setValues([rowData]);
  } else {
    // Insert
    sheet.appendRow(rowData);
  }
  
  return jsonResponse({ success: true, action: rowIndex > -1 ? "update" : "insert" });
}

function handleDelete(sheetName, id) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return jsonResponse({ success: true, message: "Sheet not found" });
  
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return jsonResponse({ success: true, message: "Empty sheet" });
  
  const idColIndex = data[0].indexOf("id");
  if (idColIndex === -1) throw new Error("Sheet missing 'id' column");
  
  for (let i = 1; i < data.length; i++) {
    if (data[i][idColIndex] === id) {
      sheet.deleteRow(i + 1);
      return jsonResponse({ success: true, action: "delete" });
    }
  }
  
  return jsonResponse({ success: true, message: "Not found" });
}

function handlePushAll(sheetName, rows) {
  if (!rows || rows.length === 0) return jsonResponse({ success: true, message: "No data" });
  
  // Get all unique keys across all rows to form headers
  const allKeys = new Set();
  rows.forEach(r => Object.keys(r).forEach(k => allKeys.add(k)));
  const headers = Array.from(allKeys);
  // Ensure 'id' is first
  if (headers.includes('id')) {
    headers.splice(headers.indexOf('id'), 1);
    headers.unshift('id');
  }
  
  const sheet = getOrCreateSheet(sheetName, headers);
  
  // Clear existing content except headers
  if (sheet.getLastRow() > 1) {
    sheet.getRange(2, 1, sheet.getLastRow() - 1, sheet.getLastColumn()).clearContent();
  }
  
  // Update headers in case they changed
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  
  const data = rows.map(rowObj => {
    return headers.map(header => {
      let val = rowObj[header];
      if (val === undefined || val === null) return "";
      if (typeof val === "object") return JSON.stringify(val);
      return val;
    });
  });
  
  if (data.length > 0) {
    sheet.getRange(2, 1, data.length, headers.length).setValues(data);
  }
  
  return jsonResponse({ success: true, count: data.length });
}

function getOrCreateSheet(sheetName, headers) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName(sheetName);
  if (!sheet) {
    sheet = ss.insertSheet(sheetName);
    // Ensure 'id' is first if exists
    if (headers.includes('id')) {
        headers = headers.filter(h => h !== 'id');
        headers.unshift('id');
    }
    sheet.appendRow(headers);
    // Format headers
    sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold").setBackground("#f3f3f3");
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function jsonResponse(data, code = 200) {
  // Return JSON wrapped in standard structure, setting HTTP response if possible
  const output = ContentService.createTextOutput(JSON.stringify(data));
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}

// For CORS preflight (if needed)
function doOptions(e) {
  const output = ContentService.createTextOutput("");
  output.setMimeType(ContentService.MimeType.JSON);
  return output;
}
`;
