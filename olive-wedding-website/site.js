/* Evergreen Vellum live demo. Nothing typed here leaves the browser: the demo RSVP is kept in this browser only. */
(function () {
  "use strict";
  var CFG = window.EV_CFG;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  // ---- countdown to the sample wedding (4:00 PM in New York, the venue's time, for every visitor)
  var target = new Date(CFG.when);
  function tick() {
    var ms = Math.max(0, target - new Date());
    var d = Math.floor(ms / 864e5), h = Math.floor(ms / 36e5) % 24, m = Math.floor(ms / 6e4) % 60, s = Math.floor(ms / 1e3) % 60;
    var v = [d, h, m, s];
    $$(".count b").forEach(function (b, i) { b.textContent = i ? String(v[i]).padStart(2, "0") : v[i]; });
  }
  tick(); setInterval(tick, 1000);

  // ---- sample links: say what the button does in the couple's own site
  var toast = $("#toast"), tt;
  $$("[data-sample]").forEach(function (a) {
    a.addEventListener("click", function (e) {
      e.preventDefault();
      toast.textContent = a.getAttribute("data-sample");
      toast.hidden = false;
      clearTimeout(tt); tt = setTimeout(function () { toast.hidden = true; }, 4200);
    });
  });

  // ---- RSVP journey: entry block -> form -> sending -> confirmed (or error) -> change my reply
  var KEY = CFG.storage;
  var form = $("#rsvp-form"), done = $("#rsvp-done"), fail = $("#rsvp-fail"), status = $("#rsvp-status");
  function saved() { try { return JSON.parse(localStorage.getItem(KEY) || "null"); } catch (e) { return null; } }
  function store(v) { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch (e) { /* private mode: keep it on screen only */ } }
  function openForm(focus, restoreSaved) {
    done.hidden = true; fail.hidden = true; form.hidden = false;
    var r = restoreSaved === false ? null : saved();   // retry keeps the unsent draft
    if (r) {
      form.elements.name.value = r.name;
      var opts = Array.prototype.map.call(form.elements.count.options, function (o) { return o.value; });
      form.elements.count.value = opts.indexOf(String(r.count)) >= 0 ? String(r.count) : opts[0];   // a decline saved "0"
      $$("input[name=attending]", form).forEach(function (x) { x.checked = x.value === r.attending; });
      form.elements.guests.value = r.guests || ""; form.elements.diet.value = r.diet || "";
      form.elements.song.value = r.song || ""; form.elements.note.value = r.note || "";
    }
    sync();
    if (focus) form.elements.name.focus();
  }
  function sync() {
    var yes = (form.querySelector("input[name=attending]:checked") || {}).value === "yes";
    $("#if-yes").hidden = !yes;
    $("#guests-row").hidden = !(yes && Number(form.elements.count.value) > 1);
  }
  $$("[data-open-rsvp]").forEach(function (b) {
    b.addEventListener("click", function (e) {
      e.preventDefault();
      $("#rsvp").scrollIntoView({ behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" });
      openForm(true);
    });
  });
  form.addEventListener("change", sync);
  function setErr(id, on) {
    var el = $("#" + id), field = id === "err-name" ? form.elements.name : $("#att-set");
    el.hidden = !on; field.setAttribute("aria-invalid", on ? "true" : "false");
  }
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var name = form.elements.name.value.trim();
    var att = (form.querySelector("input[name=attending]:checked") || {}).value;
    setErr("err-name", !name); setErr("err-att", !att);
    if (!name || !att) {
      status.textContent = "Please check the highlighted answers.";
      (!name ? form.elements.name : form.querySelector("input[name=attending]")).focus();
      return;
    }
    var before = saved();
    var reply = { name: name, attending: att, count: att === "yes" ? form.elements.count.value : "0",
      guests: att === "yes" ? form.elements.guests.value.trim() : "", diet: att === "yes" ? form.elements.diet.value.trim() : "",
      song: att === "yes" ? form.elements.song.value.trim() : "", note: form.elements.note.value.trim(), at: new Date().toISOString() };
    var btn = $("#send");
    btn.disabled = true; btn.innerHTML = '<span class="spinner" aria-hidden="true"></span>' + CFG.t.sending;
    status.textContent = CFG.t.sending;
    setTimeout(function () {
      btn.disabled = false; btn.textContent = CFG.t.send;
      if (navigator.onLine === false) {                 // the one real failure a guest can hit: no connection
        form.hidden = true; fail.hidden = false; status.textContent = CFG.t.offline; $("#fail-title").focus(); return;
      }
      store(reply); show(reply, !!before);
    }, 900);
  });
  function show(r, updated, quiet) {
    form.hidden = true; fail.hidden = true; done.hidden = false;
    var first = r.name.split(" ")[0];
    $("#done-title").textContent = (updated ? CFG.t.updated : CFG.t.thanks).replace("{name}", first);
    var li = [["Name", r.name], ["Attending", r.attending === "yes" ? CFG.t.yes : CFG.t.no]];
    if (r.attending === "yes") {
      li.push(["Coming", r.count + (r.count === "1" ? " guest" : " guests")]);
      if (r.guests) li.push(["With you", r.guests]);
      if (r.diet) li.push(["Meal or dietary needs", r.diet]);
      if (r.song) li.push(["Song", r.song]);
    }
    if (r.note) li.push(["Note", r.note]);
    var ul = $("#done-list"); ul.innerHTML = "";
    li.forEach(function (p) { var e = document.createElement("li"); var b = document.createElement("b"); b.textContent = p[0] + ": ";
      e.appendChild(b); e.appendChild(document.createTextNode(p[1])); ul.appendChild(e); });
    if (quiet) return;
    status.textContent = $("#done-title").textContent;
    $("#done-title").focus();
  }
  $("#change").addEventListener("click", function () { openForm(true); });
  $("#retry").addEventListener("click", function () { openForm(true, false); });
  var prev = saved();
  if (prev) show(prev, false, true);

  // ---- optional opening (only in builds that include it): about 1 s, skippable, keyboard operable
  var op = $("#opening");
  if (op) {
    var reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
    var close = function () { op.remove(); $("#top h1").setAttribute("tabindex", "-1"); $("#top h1").focus(); };
    $("#open-btn").addEventListener("click", function () {
      if (reduce) return close();
      op.classList.add("open"); setTimeout(close, 1000);
    });
    $("#skip-open").addEventListener("click", function (e) { e.preventDefault(); close(); });
    $("#open-btn").focus();
  }
})();
