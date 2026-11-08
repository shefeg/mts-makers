/* Emerald Vow save-the-date demo. Nothing typed here leaves the browser: the demo address is kept in this browser only. */
(function () {
  "use strict";
  var CFG = window.EV_CFG;
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  var target = new Date(CFG.when);
  function tick() {
    var ms = Math.max(0, target - new Date());
    var v = [Math.floor(ms / 864e5), Math.floor(ms / 36e5) % 24, Math.floor(ms / 6e4) % 60, Math.floor(ms / 1e3) % 60];
    $$(".count b").forEach(function (b, i) { b.textContent = i ? String(v[i]).padStart(2, "0") : v[i]; });
  }
  tick(); setInterval(tick, 1000);

  var toast = $("#toast"), tt;
  $$("[data-sample]").forEach(function (a) {
    a.addEventListener("click", function (e) {
      e.preventDefault();
      toast.textContent = a.getAttribute("data-sample");
      toast.hidden = false;
      clearTimeout(tt); tt = setTimeout(function () { toast.hidden = true; }, 4200);
    });
  });

  // address journey: form -> sending -> thank you (or error) -> change my address
  var KEY = CFG.storage, T = CFG.t;
  var form = $("#addr-form"), done = $("#addr-done"), fail = $("#addr-fail"), status = $("#addr-status");
  function saved() { try { return JSON.parse(localStorage.getItem(KEY) || "null"); } catch (e) { return null; } }
  function store(v) { try { localStorage.setItem(KEY, JSON.stringify(v)); } catch (e) { /* private mode */ } }
  function openForm(focus, restoreSaved) {
    done.hidden = true; fail.hidden = true; form.hidden = false;
    var r = restoreSaved === false ? null : saved();
    if (r) { form.elements.name.value = r.name; form.elements.address.value = r.address; form.elements.email.value = r.email || ""; }
    if (focus) form.elements.name.focus();
  }
  function setErr(id, field, on) { $("#" + id).hidden = !on; field.setAttribute("aria-invalid", on ? "true" : "false"); }
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    var name = form.elements.name.value.trim(), addr = form.elements.address.value.trim();
    setErr("err-name", form.elements.name, !name); setErr("err-address", form.elements.address, !addr);
    if (!name || !addr) {
      status.textContent = "Please check the highlighted answers.";
      (!name ? form.elements.name : form.elements.address).focus();
      return;
    }
    var before = saved();
    var r = { name: name, address: addr, email: form.elements.email.value.trim(), at: new Date().toISOString() };
    var btn = $("#send");
    btn.disabled = true; btn.innerHTML = '<span class="spinner" aria-hidden="true"></span>' + T.sending;
    status.textContent = T.sending;
    setTimeout(function () {
      btn.disabled = false; btn.textContent = T.send;
      if (navigator.onLine === false) {
        form.hidden = true; fail.hidden = false; status.textContent = T.offline; $("#fail-title").focus(); return;
      }
      store(r); show(r, !!before);
    }, 900);
  });
  function show(r, updated, quiet) {
    form.hidden = true; fail.hidden = true; done.hidden = false;
    $("#done-title").textContent = (updated ? T.updated : T.thanks).replace("{name}", r.name.split(/[ &,]/)[0]);
    var ul = $("#done-list"); ul.innerHTML = "";
    [["Names", r.name], ["Address", r.address]].concat(r.email ? [["Email", r.email]] : []).forEach(function (p) {
      var li = document.createElement("li"), b = document.createElement("b");
      b.textContent = p[0] + ": "; li.appendChild(b); li.appendChild(document.createTextNode(p[1])); ul.appendChild(li);
    });
    if (quiet) return;
    status.textContent = $("#done-title").textContent;
    $("#done-title").focus();
  }
  $("#change").addEventListener("click", function () { openForm(true); });
  $("#retry").addEventListener("click", function () { openForm(true, false); });
  var prev = saved();
  if (prev) show(prev, false, true);
})();
