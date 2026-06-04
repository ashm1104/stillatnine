/* Still at Nine — Story Email: client chrome + app + tweaks */
const { useState } = React;

const CHROME = {
  light: {
    stage:"#D9D1C3", header:"#FFFFFF", headerText:"#1A140D", headerMuted:"#8A7C68",
    divider:"#E7DFD0", bezel:"#1c160f", icon:"#9C8E78", star:"#D8A24C",
  },
  dark: {
    stage:"#0B0805", header:"#171209", headerText:"#ECE6DA", headerMuted:"#9A8F7D",
    divider:"#2A2218", bezel:"#000000", icon:"#8A7E6A", star:"#D8A24C",
  },
};

function Avatar({ size = 40 }) {
  return <img src="brand/badge.png" alt="Still at Nine" width={size} height={size}
    style={{ borderRadius:"50%", display:"block", boxShadow:"0 1px 4px rgba(0,0,0,.3)" }} />;
}

function Ico({ d, c, s = 20 }) {
  return <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke={c} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" style={{ display:"block" }}><path d={d} /></svg>;
}
const I = {
  back:"M15 18l-6-6 6-6", star:"M12 17.3l-5.5 3 1-6.1-4.4-4.3 6.1-.9L12 3.6l2.7 5.5 6.1.9-4.4 4.3 1 6.1z",
  archive:"M3 7h18M5 7l1 12h12l1-12M9 11h6", reply:"M9 17l-5-5 5-5M4 12h11a5 5 0 0 1 5 5v1", dots:"M5 12h.01M12 12h.01M19 12h.01",
};

/* ---- inbox list row (demonstrates subject + preheader / preview text) ---- */
function InboxRow({ c, meta }) {
  const E = meta;
  return (
    <div style={{ display:"flex", gap:13, padding:"15px 16px", background:c.header, borderBottom:`1px solid ${c.divider}`, alignItems:"flex-start" }}>
      <Avatar size={42} />
      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"baseline", gap:8 }}>
          <span style={{ fontFamily:"'Spectral',Georgia,serif", fontWeight:600, fontSize:15.5, color:c.headerText, whiteSpace:"nowrap" }}>{E.fromName}</span>
          <span style={{ fontFamily:"'Spectral',Georgia,serif", fontSize:12.5, color:c.headerMuted, whiteSpace:"nowrap" }}>9:00 PM</span>
        </div>
        <div style={{ fontFamily:"'Spectral',Georgia,serif", fontWeight:600, fontSize:14.5, color:c.headerText, marginTop:3, overflow:"hidden", textOverflow:"ellipsis", whiteSpace:"nowrap" }}>
          {E.subject}
        </div>
        <div style={{ fontFamily:"'Spectral',Georgia,serif", fontSize:13.5, color:c.headerMuted, marginTop:2, lineHeight:1.4, display:"-webkit-box", WebkitLineClamp:2, WebkitBoxOrient:"vertical", overflow:"hidden" }}>
          {E.preheader}
        </div>
      </div>
      <span style={{ width:9, height:9, borderRadius:"50%", background:c.star, marginTop:5, flex:"0 0 auto" }} />
    </div>
  );
}

/* ---- opened message header ---- */
function MsgHeader({ c, meta }) {
  const E = meta;
  return (
    <div style={{ background:c.header, borderBottom:`1px solid ${c.divider}` }}>
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 14px" }}>
        <Ico d={I.back} c={c.icon} s={22} />
        <div style={{ display:"flex", gap:18 }}>
          <Ico d={I.archive} c={c.icon} /><Ico d={I.reply} c={c.icon} /><Ico d={I.dots} c={c.icon} />
        </div>
      </div>
      <div style={{ padding:"4px 18px 16px" }}>
        <h2 style={{ margin:"0 0 14px", fontFamily:"'Spectral',Georgia,serif", fontWeight:600, fontSize:19, lineHeight:1.3, color:c.headerText }}>{E.subject}</h2>
        <div style={{ display:"flex", gap:12, alignItems:"center" }}>
          <Avatar size={40} />
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontFamily:"'Spectral',Georgia,serif", fontSize:14.5, color:c.headerText }}>
              <span style={{ fontWeight:600 }}>{E.fromName}</span>
              <span style={{ color:c.headerMuted }}> &lt;{E.fromEmail}&gt;</span>
            </div>
            <div style={{ fontFamily:"'Spectral',Georgia,serif", fontSize:13, color:c.headerMuted, marginTop:1 }}>to me &middot; {E.dateLabel}</div>
          </div>
          <Ico d={I.star} c={c.headerMuted} s={20} />
        </div>
      </div>
    </div>
  );
}

function Label({ children, dark }) {
  return <div style={{ fontFamily:"'Spectral SC','Spectral',serif", fontSize:11, letterSpacing:"0.22em", textTransform:"uppercase", color: dark?"#9C8E78":"#8A7C68", margin:"0 0 10px 4px" }}>{children}</div>;
}

function App() {
  const [tw, setTweak] = useTweaks({ email:"story", theme:"hybrid", atmosphere:"full", client:"light", device:"mobile" });
  const c = CHROME[tw.client];
  const mobile = tw.device === "mobile";
  const dark = tw.client === "dark";
  const meta = tw.email === "welcome" ? window.WELCOME : window.EMAIL;
  const Body = tw.email === "welcome" ? WelcomeTemplate : EmailTemplate;

  const frameW = mobile ? 414 : 880;
  const bodyH = mobile ? 712 : 660;

  return (
    <React.Fragment>
      <div style={{ minHeight:"100vh", background:c.stage, transition:"background .3s", padding: mobile ? "44px 16px 80px" : "40px 24px 80px", boxSizing:"border-box", display:"flex", justifyContent:"center" }}>
        <div style={{ width:frameW, maxWidth:"100%" }}>

          <Label dark={dark}>In the inbox</Label>
          <div style={{ borderRadius:14, overflow:"hidden", border:`1px solid ${c.divider}`, boxShadow: dark?"0 12px 40px rgba(0,0,0,.5)":"0 12px 40px rgba(60,45,25,.16)", marginBottom:30 }}>
            <InboxRow c={c} meta={meta} />
          </div>

          <Label dark={dark}>Opened</Label>
          {/* device / window frame */}
          <div style={{
            borderRadius: mobile ? 40 : 14, background:c.bezel,
            padding: mobile ? 11 : 0, overflow:"hidden",
            boxShadow: dark ? "0 24px 70px rgba(0,0,0,.6)" : "0 24px 70px rgba(60,45,25,.22)",
          }}>
            {!mobile && (
              <div style={{ display:"flex", alignItems:"center", gap:8, padding:"11px 14px", background:c.header, borderBottom:`1px solid ${c.divider}` }}>
                <span style={{ width:11, height:11, borderRadius:"50%", background:"#e0625a" }} />
                <span style={{ width:11, height:11, borderRadius:"50%", background:"#e2b94e" }} />
                <span style={{ width:11, height:11, borderRadius:"50%", background:"#67c15a" }} />
                <span style={{ flex:1, textAlign:"center", fontFamily:"'Spectral',serif", fontSize:12.5, color:c.headerMuted, letterSpacing:"0.04em" }}>Still at Nine &mdash; {meta.subject}</span>
              </div>
            )}
            <div style={{ borderRadius: mobile ? 30 : 0, overflow:"hidden", background:"#000" }}>
              {mobile && (
                <div style={{ background:c.header, padding:"8px 22px 6px", display:"flex", justifyContent:"space-between", alignItems:"center", fontFamily:"-apple-system,system-ui,sans-serif", fontSize:13, fontWeight:600, color:c.headerText }}>
                  <span>9:00</span>
                  <span style={{ display:"flex", gap:5, alignItems:"center", opacity:.85 }}>
                    <span style={{ fontSize:11 }}>&#9679;&#9679;&#9679;</span>
                    <span style={{ width:22, height:11, border:`1px solid ${c.headerMuted}`, borderRadius:3, display:"inline-block", position:"relative" }}>
                      <span style={{ position:"absolute", inset:1, right:6, background:c.headerText, borderRadius:1 }} />
                    </span>
                  </span>
                </div>
              )}
              <MsgHeader c={c} meta={meta} />
              <div style={{ height:bodyH, overflowY:"auto", background: ETHEMES[tw.theme].page, WebkitOverflowScrolling:"touch" }}>
                <Body theme={tw.theme} atmosphere={tw.atmosphere} width={600} />
              </div>
            </div>
          </div>

        </div>
      </div>

      <TweaksPanel>
        <TweakSection label="Email" />
        <TweakRadio label="Which email" value={tw.email} options={["story","welcome"]} onChange={v=>setTweak("email",v)} />
        <TweakSection label="Reading theme" />
        <TweakRadio label="Theme" value={tw.theme} options={["hybrid","dark","cream"]} onChange={v=>setTweak("theme",v)} />
        <TweakRadio label="Atmosphere" value={tw.atmosphere} options={["restrained","full"]} onChange={v=>setTweak("atmosphere",v)} />
        <TweakSection label="Client preview" />
        <TweakRadio label="Appearance" value={tw.client} options={["light","dark"]} onChange={v=>setTweak("client",v)} />
        <TweakRadio label="Device" value={tw.device} options={["mobile","desktop"]} onChange={v=>setTweak("device",v)} />
      </TweaksPanel>
    </React.Fragment>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
