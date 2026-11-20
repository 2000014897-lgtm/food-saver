# AI FoodSaver — Frontend Prototype

## What this prototype does
- Add, edit and remove food items.
- Save inventory in the browser using `localStorage`.
- Track user-entered expiry dates and highlight items needing attention.
- Suggest simple recipes by matching ingredient names against inventory.
- Show inventory category summaries and items marked as used.
- Responsive purple-and-white dashboard.

## Important project limitation
This is a **frontend prototype**. It does not include a Python/Flask backend, user accounts, cloud database, image-recognition model, trained predictive model, or real push/email notifications. Recipe matching and expiry labels use JavaScript rules, not a trained AI model. Describe them accurately in your submission. You can present this as an initial AI-assisted prototype and list true AI integration as future work unless you add a real model.

## How to run
1. Extract the ZIP file.
2. Open the `AI-FoodSaver` folder.
3. Double-click `index.html` to open it in Chrome or Edge.
4. Click **Add food item** and enter sample food details.
5. Explore My Inventory, Expiry Tracker, Recipe Ideas and Insights.
6. Data is saved in that browser on that computer. Clearing browser data may remove it.

## Suggested demo data
Use today's date as a reference and add a few items with expiry dates:
- Bananas — Fruits — 4 pcs — 1 day from today
- Tomatoes — Vegetables — 500 g — 2 days from today
- Milk — Dairy — 1 litre — today's date
- Rice — Grains — 1 kg — 30 days from today

Use dates that match your actual demo day. Do not use expired or unsafe food for consumption.

## Submission screenshots
Capture:
1. Overview dashboard with sample data.
2. My inventory table.
3. Expiry tracker.
4. Recipe ideas showing ingredient matches.
5. Insights/category chart.
6. A test-results table showing what you actually tested.

## Suggested test cases
| Test | Steps | Expected result |
|---|---|---|
| Add item | Add an item with name, category and quantity | Item appears in inventory |
| Edit item | Click Edit and change quantity | Updated quantity appears |
| Delete item | Click × and confirm | Item disappears |
| Expiry tracker | Add an expiry date within 3 days | Item is highlighted |
| Recipe matching | Add an ingredient such as banana | Matching recipe appears |
| Insights | Add items in different categories | Category bars update |
| Persistence | Refresh the browser | Inventory remains saved |

Record actual outcomes as Pass/Fail after testing.
