// src/lib/receiptParser.js
import { extractText } from "../utils/ocr";
import { dbHelpers } from "./supabase";

// Parse OCR text into inventory items
function parseReceiptText(text) {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const items = [];

  // Patterns:
  // - "Tomato 2 x 30"  => name, qty, price-per-unit
  // - "Potato 40"      => name, price (assume qty 1)
  const itemLineRegex = /^([A-Za-z0-9\s\-\&\.\(\)]+)\s+(\d+)\s*x\s*([\d\.]+)/i;
  const simpleItemRegex = /^([A-Za-z0-9\s\-\&\.\(\)]+)\s+([\d\.]+)$/;

  for (let line of lines) {
    // try "name qty x price"
    let match = line.match(itemLineRegex);
    if (match) {
      items.push({
        name: match[1].trim(),
        quantity: Number(match[2]),
        cost: Number(match[3]),
      });
      continue;
    }

    // try "name price" (assume qty = 1)
    match = line.match(simpleItemRegex);
    if (match) {
      items.push({
        name: match[1].trim(),
        quantity: 1,
        cost: Number(match[2]),
      });
    }
  }

  return items;
}

/**
 * Process receipt image/file, extract text, parse items, insert into inventory.
 * - imageFile: a File object (what you're already passing from Upload)
 * - userId: uuid of the current user
 */
export async function processReceipt(imageFile, userId) {
  try {
    if (!imageFile) {
      console.log("processReceipt: no imageFile provided");
      return;
    }

    // Extract text using your OCR util (works with File objects)
    const text = await extractText(imageFile);

    if (!text || text.trim() === "") {
      console.log("processReceipt: No OCR text extracted");
      return;
    }

    const parsedItems = parseReceiptText(text);

    if (!parsedItems || parsedItems.length === 0) {
      console.log("processReceipt: No items parsed from receipt");
      return;
    }

    console.log("processReceipt: Parsed items:", parsedItems);

    // Insert each item into your inventory table
    for (let item of parsedItems) {
      // Defensive: ensure name exists and quantity is number
      const itemName = item.name ? String(item.name).trim() : "Unknown item";
      const qty = Number.isFinite(item.quantity) ? Number(item.quantity) : 1;
      const costVal = item.cost && !Number.isNaN(Number(item.cost)) ? Number(item.cost) : null;

      const inventoryRow = {
        user_id: userId,
        item_name: itemName,
        quantity: qty,
        original_quantity: qty,
        category: "Other",
        unit: "piece",
        purchase_date: new Date().toISOString().split("T")[0],
        expiry_date: null,
        cost: costVal,
      };

      // call your db helper and check result
      try {
        const { data: inserted, error } = await dbHelpers.addInventoryItem(inventoryRow);

        if (error) {
          // Log the error with enough context to debug RLS/schema issues
          console.error("processReceipt: addInventoryItem error", {
            error,
            attemptedRow: inventoryRow,
          });
        } else {
          console.log("processReceipt: Inserted inventory item", inserted);
        }
      } catch (dbErr) {
        console.error("processReceipt: unexpected error inserting item", {
          dbErr,
          attemptedRow: inventoryRow,
        });
      }
    }

    console.log("processReceipt: all parsed items processed");
  } catch (err) {
    console.error("processReceipt failed:", err);
  }
}
