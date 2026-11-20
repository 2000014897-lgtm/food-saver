const STORAGE_KEY = "foodsaver_inventory_v1";
const HISTORY_KEY = "foodsaver_used_v1";
let inventory = load(STORAGE_KEY, []);
let usedCount = Number(localStorage.getItem(HISTORY_KEY) || 0);
let toastTimer;

const $ = (id) => document.getElementById(id);
const todayISO = () => {
  const d = new Date();
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
};
function load(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
}
function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(inventory));
  localStorage.setItem(HISTORY_KEY, String(usedCount));
  renderAll();
}
function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, c => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c]));
}
function emojiFor(category, name="") {
  const n = name.toLowerCase();
  if (n.includes("apple")) return "🍎"; if (n.includes("banana")) return "🍌"; if (n.includes("orange")) return "🍊";
  if (n.includes("tomato")) return "🍅"; if (n.includes("potato")) return "🥔"; if (n.includes("carrot")) return "🥕";
  if (n.includes("milk")) return "🥛"; if (n.includes("bread")) return "🍞"; if (n.includes("egg")) return "🥚";
  return ({Fruits:"🍇",Vegetables:"🥦",Dairy:"🧀",Grains:"🌾",Other:"🥫"})[category] || "🥗";
}
function daysUntil(date) {
  if (!date) return null;
  const a = new Date(todayISO() + "T00:00:00");
  const b = new Date(date + "T00:00:00");
  return Math.round((b - a) / 86400000);
}
function statusFor(item) {
  const days = daysUntil(item.expiry);
  if (days === null) return {label:"No date", cls:"ok", days};
  if (days < 0) return {label:"Past entered date", cls:"past", days};
  if (days === 0) return {label:"Expires today", cls:"today", days};
  if (days <= 3) return {label:`${days} day${days===1?"":"s"} left`, cls:"soon", days};
  return {label:"On track", cls:"ok", days};
}
function dateLabel(date) {
  if (!date) return "Not entered";
  return new Date(date + "T00:00:00").toLocaleDateString(undefined,{day:"numeric",month:"short",year:"numeric"});
}
function money(value) {
  return new Intl.NumberFormat("en-IN",{style:"currency",currency:"INR",maximumFractionDigits:0}).format(value || 0);
}
function showToast(message) {
  const t=$("toast"); t.textContent=message; t.classList.add("show");
  clearTimeout(toastTimer); toastTimer=setTimeout(()=>t.classList.remove("show"),2400);
}
function switchView(name) {
  document.querySelectorAll(".view").forEach(v=>v.classList.toggle("active",v.id===`view-${name}`));
  document.querySelectorAll(".nav-link").forEach(b=>b.classList.toggle("active",b.dataset.view===name));
  const labels={overview:"Overview",inventory:"My inventory",expiry:"Expiry tracker",recipes:"Recipe ideas",insights:"Insights"};
  $("breadcrumb-current").textContent=labels[name]||"Overview";
  $("sidebar").classList.remove("open");
  if(name==="recipes") renderRecipes();
}
function openModal(item=null) {
  $("food-form").reset();
  $("food-id").value=item?.id || "";
  $("modal-title").textContent=item?"Edit food item":"Add food item";
  $("food-name").value=item?.name || "";
  $("food-category").value=item?.category || "Fruits";
  $("food-quantity").value=item?.quantity ?? 1;
  $("food-unit").value=item?.unit || "pcs";
  $("food-expiry").value=item?.expiry || "";
  $("food-price").value=item?.price ?? "";
  $("food-modal").classList.add("open");
  $("food-modal").setAttribute("aria-hidden","false");
  setTimeout(()=>$("food-name").focus(),50);
}
function closeModal() {$("food-modal").classList.remove("open");$("food-modal").setAttribute("aria-hidden","true");}
function handleSubmit(e) {
  e.preventDefault();
  const id=$("food-id").value || (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()));
  const item={id,name:$("food-name").value.trim(),category:$("food-category").value,quantity:Number($("food-quantity").value),unit:$("food-unit").value,expiry:$("food-expiry").value,price:Number($("food-price").value)||0,addedAt:new Date().toISOString()};
  if(!item.name || item.quantity<=0){showToast("Please enter a valid food name and quantity.");return;}
  const index=inventory.findIndex(x=>x.id===id);
  if(index>=0){item.addedAt=inventory[index].addedAt;inventory[index]=item;showToast("Food item updated.");}
  else {inventory.push(item);showToast("Food item added to your kitchen.");}
  closeModal();save();
}
function deleteItem(id) {
  if(!confirm("Remove this item from your inventory?")) return;
  inventory=inventory.filter(x=>x.id!==id);save();showToast("Item removed.");
}
function markUsed(id) {
  const item=inventory.find(x=>x.id===id);
  if(!item)return;
  inventory=inventory.filter(x=>x.id!==id);usedCount++;save();showToast(`${item.name} marked as used. Great job!`);
}
function renderInventory() {
  const q=$("inventory-search").value.toLowerCase().trim();
  const cat=$("category-filter").value, sort=$("sort-filter").value;
  let list=inventory.filter(x=>(x.name.toLowerCase().includes(q))&&(cat==="all"||x.category===cat));
  list.sort((a,b)=>sort==="name"?a.name.localeCompare(b.name):sort==="newest"?b.addedAt.localeCompare(a.addedAt):(a.expiry||"9999").localeCompare(b.expiry||"9999"));
  $("inventory-body").innerHTML=list.map(item=>{
    const s=statusFor(item);
    return `<tr><td><div class="table-food"><span class="food-emoji">${emojiFor(item.category,item.name)}</span><strong>${escapeHTML(item.name)}</strong></div></td><td>${escapeHTML(item.category)}</td><td>${item.quantity} ${escapeHTML(item.unit)}</td><td>${dateLabel(item.expiry)}</td><td><span class="status ${s.cls}">${s.label}</span></td><td><div class="row-actions"><button class="mini-btn" data-edit="${item.id}">Edit</button><button class="mini-btn" data-used="${item.id}">Used</button><button class="mini-btn danger" data-delete="${item.id}">×</button></div></td></tr>`;
  }).join("");
  $("inventory-empty").style.display=list.length?"none":"block";
  $("inventory-body").closest(".table-wrap").style.display=list.length?"block":"none";
  $("nav-count").textContent=inventory.length;
}
function renderOverview() {
  const expiring=inventory.filter(x=>{const d=daysUntil(x.expiry);return d!==null&&d>=0&&d<=3;});
  $("stat-total").textContent=inventory.length;
  $("stat-expiring").textContent=expiring.length;
  $("stat-rescued").textContent=usedCount;
  $("stat-value").textContent=money(inventory.reduce((s,x)=>s+(Number(x.price)||0),0));
  const list=[...inventory].filter(x=>x.expiry).sort((a,b)=>a.expiry.localeCompare(b.expiry)).slice(0,4);
  $("overview-expiry").innerHTML=list.length?list.map(x=>{const s=statusFor(x);return `<div class="compact-item"><span class="food-emoji">${emojiFor(x.category,x.name)}</span><div class="compact-info"><strong>${escapeHTML(x.name)}</strong><small>${dateLabel(x.expiry)}</small></div><span class="status ${s.cls}">${s.label}</span></div>`;}).join(""):`<div class="empty-state"><div>🌿</div><strong>No expiry dates yet</strong><p>Add food with an expiry date to see reminders here.</p></div>`;
  const soon=expiring[0];
  $("smart-tip").innerHTML=soon?`<div class="tip-emoji">🥗</div><div><strong>Use ${escapeHTML(soon.name)} first</strong><p>Its entered date is ${statusFor(soon).days===0?"today":`in ${statusFor(soon).days} day(s)`}. Consider planning a meal around it.</p></div>`:`<div class="tip-emoji">🌱</div><div><strong>Build a smart routine</strong><p>Add your food items and expiry dates. FoodSaver will help you prioritise what to use.</p></div>`;
}
function renderExpiry() {
  const withDates=inventory.filter(x=>x.expiry).sort((a,b)=>a.expiry.localeCompare(b.expiry));
  const past=withDates.filter(x=>daysUntil(x.expiry)<0).length;
  const today=withDates.filter(x=>daysUntil(x.expiry)===0).length;
  const soon=withDates.filter(x=>{const d=daysUntil(x.expiry);return d>0&&d<=3;}).length;
  $("expiry-summary").innerHTML=`<div class="summary-box"><span>Past entered date</span><strong>${past}</strong></div><div class="summary-box"><span>Expires today</span><strong>${today}</strong></div><div class="summary-box"><span>Within 3 days</span><strong>${soon}</strong></div>`;
  $("expiry-list").innerHTML=withDates.length?withDates.map(x=>{const s=statusFor(x);return `<div class="expiry-row"><span class="food-emoji">${emojiFor(x.category,x.name)}</span><div class="compact-info"><strong>${escapeHTML(x.name)}</strong><small>${x.quantity} ${escapeHTML(x.unit)} · ${escapeHTML(x.category)}</small></div><span class="expiry-date">${dateLabel(x.expiry)}</span><span class="status ${s.cls}">${s.label}</span></div>`;}).join(""):`<div class="empty-state"><div>🗓️</div><strong>No dated items yet</strong><p>Add expiry dates to your inventory to use this tracker.</p></div>`;
}
const recipes=[
 {name:"Garden vegetable stir-fry",emoji:"🥦",ingredients:["broccoli","carrot","capsicum","onion","tomato"],time:"20 min",steps:"Chop the vegetables. Heat a little oil, sauté onion, add firm vegetables first, then softer vegetables. Season and cook until tender."},
 {name:"Fresh fruit bowl",emoji:"🍓",ingredients:["apple","banana","orange","grapes","mango"],time:"10 min",steps:"Wash and cut fresh fruit into bite-sized pieces. Combine in a bowl and serve chilled. Use only fruit that is in good condition."},
 {name:"Tomato vegetable sandwich",emoji:"🥪",ingredients:["tomato","bread","cucumber","onion","cheese"],time:"15 min",steps:"Slice the vegetables. Layer them with cheese between bread slices. Toast until warm and serve."},
 {name:"Simple vegetable rice",emoji:"🍚",ingredients:["rice","carrot","peas","onion","beans"],time:"25 min",steps:"Cook rice. Sauté chopped vegetables with seasoning, add cooked rice and mix until heated through."},
 {name:"Banana breakfast smoothie",emoji:"🥤",ingredients:["banana","milk","yogurt"],time:"5 min",steps:"Blend banana with milk and yogurt until smooth. Serve immediately. Use ingredients that have been stored safely."},
 {name:"Potato and onion hash",emoji:"🥔",ingredients:["potato","onion","tomato","capsicum"],time:"25 min",steps:"Dice potatoes and vegetables. Cook potatoes until tender, add onion and other vegetables, then season and finish cooking."}
];
function renderRecipes() {
  const names=inventory.map(x=>x.name.toLowerCase());
  const ranked=recipes.map(r=>({...r,matched:r.ingredients.filter(i=>names.some(n=>n.includes(i)||i.includes(n))).length})).sort((a,b)=>b.matched-a.matched);
  const available=ranked.filter(r=>r.matched>0);
  const show=available.length?available:ranked.slice(0,3);
  $("recipe-count").textContent=available.length?`${available.length} ideas matched to your inventory`:"Example ideas — add ingredients for personalised matching";
  $("recipe-grid").innerHTML=show.slice(0,6).map(r=>`<article class="recipe-card"><div class="recipe-image">${r.emoji}</div><div class="recipe-body"><h4>${r.name}</h4><p>⏱ ${r.time} · ${r.ingredients.length} suggested ingredients</p><span class="match-tag">${r.matched?`${r.matched} ingredient match${r.matched>1?"es":""}`:"Try this idea"}</span><details><summary>View simple method</summary><p>${r.steps}</p><p><strong>Ingredients:</strong> ${r.ingredients.join(", ")}</p></details></div></article>`).join("");
}
function renderInsights() {
  $("insight-total").textContent=inventory.length;
  $("insight-used").textContent=usedCount;
  $("insight-past").textContent=inventory.filter(x=>x.expiry&&daysUntil(x.expiry)<0).length;
  $("impact-number").textContent=usedCount;
  const cats=["Fruits","Vegetables","Dairy","Grains","Other"];
  const counts=cats.map(c=>({name:c,count:inventory.filter(x=>x.category===c).length}));
  const max=Math.max(1,...counts.map(x=>x.count));
  $("category-chart").innerHTML=counts.map(x=>`<div class="bar-row"><span>${x.name}</span><div class="bar-track"><div class="bar-fill" style="width:${x.count/max*100}%"></div></div><strong>${x.count}</strong></div>`).join("");
}
function renderAll(){renderInventory();renderOverview();renderExpiry();renderInsights();$("last-updated").textContent="Updated just now";}
document.querySelectorAll(".nav-link").forEach(b=>b.addEventListener("click",()=>switchView(b.dataset.view)));
document.querySelectorAll("[data-go]").forEach(b=>b.addEventListener("click",()=>switchView(b.dataset.go)));
$("add-food-main").addEventListener("click",()=>openModal());
$("add-food-inventory").addEventListener("click",()=>openModal());
$("quick-add").addEventListener("click",()=>openModal());
$("empty-add").addEventListener("click",()=>openModal());
$("close-modal").addEventListener("click",closeModal);
$("cancel-modal").addEventListener("click",closeModal);
$("food-modal").addEventListener("click",e=>{if(e.target===$("food-modal"))closeModal();});
$("food-form").addEventListener("submit",handleSubmit);
$("inventory-search").addEventListener("input",renderInventory);
$("category-filter").addEventListener("change",renderInventory);
$("sort-filter").addEventListener("change",renderInventory);
$("inventory-body").addEventListener("click",e=>{
  const edit=e.target.closest("[data-edit]"), del=e.target.closest("[data-delete]"), used=e.target.closest("[data-used]");
  if(edit){const item=inventory.find(x=>x.id===edit.dataset.edit);if(item)openModal(item);}
  if(del)deleteItem(del.dataset.delete);
  if(used)markUsed(used.dataset.used);
});
$("refresh-recipes").addEventListener("click",()=>{renderRecipes();showToast("Recipe ideas refreshed.");});
$("mobile-menu").addEventListener("click",()=>$("sidebar").classList.toggle("open"));
$("today-label").textContent=new Date().toLocaleDateString(undefined,{weekday:"short",day:"numeric",month:"short"});
renderAll();
