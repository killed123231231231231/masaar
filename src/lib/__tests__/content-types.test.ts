import { describe, it, expect } from "vitest";
import {
  encodeVCard,
  encodeWifi,
  encodeEmail,
  encodeSms,
  encodePhone,
  encodeWhatsapp,
  encodeAppLink,
} from "../content-types";

describe("encodeWifi", () => {
  it("builds a WPA network string", () => {
    expect(
      encodeWifi({ ssid: "Cafe", password: "hunter2", encryption: "WPA" })
    ).toBe("WIFI:T:WPA;S:Cafe;P:hunter2;;");
  });

  it("omits the password for an open (nopass) network", () => {
    expect(encodeWifi({ ssid: "Free", encryption: "nopass" })).toBe(
      "WIFI:T:nopass;S:Free;;"
    );
  });

  it("defaults a missing encryption to nopass", () => {
    expect(encodeWifi({ ssid: "Open" })).toBe("WIFI:T:nopass;S:Open;;");
  });

  it("flags a hidden network", () => {
    expect(
      encodeWifi({ ssid: "Stealth", password: "p", encryption: "WPA", hidden: true })
    ).toBe("WIFI:T:WPA;S:Stealth;P:p;H:true;;");
  });

  it("escapes the reserved characters \\ ; , : \" in ssid and password", () => {
    expect(
      encodeWifi({ ssid: "My;Net", password: 'a:b,c"', encryption: "WPA" })
    ).toBe('WIFI:T:WPA;S:My\\;Net;P:a\\:b\\,c\\";;');
  });
});

describe("encodeVCard", () => {
  it("emits a v3.0 card with only the provided fields", () => {
    const out = encodeVCard({
      firstName: "Sara",
      lastName: "Ali",
      organization: "Karak Express",
      phone: "+966500000000",
    });
    expect(out.startsWith("BEGIN:VCARD\nVERSION:3.0")).toBe(true);
    expect(out).toContain("N:Ali;Sara;;;");
    expect(out).toContain("FN:Sara Ali");
    expect(out).toContain("ORG:Karak Express");
    expect(out).toContain("TEL;TYPE=CELL:+966500000000");
    expect(out.endsWith("END:VCARD")).toBe(true);
    // Unprovided fields must not appear.
    expect(out).not.toContain("TITLE:");
    expect(out).not.toContain("EMAIL:");
    expect(out).not.toContain("URL:");
    expect(out).not.toContain("ADR:");
  });

  it("escapes ; and , inside field values", () => {
    const out = encodeVCard({ firstName: "A", lastName: "B", organization: "Acme, Inc;LLC" });
    expect(out).toContain("ORG:Acme\\, Inc\\;LLC");
  });
});

describe("encodeEmail", () => {
  it("appends subject and body as a query string", () => {
    expect(encodeEmail({ to: "a@b.com", subject: "Hi there", body: "Line one" })).toBe(
      "mailto:a@b.com?subject=Hi+there&body=Line+one"
    );
  });

  it("omits the query string when only a recipient is given", () => {
    expect(encodeEmail({ to: "a@b.com" })).toBe("mailto:a@b.com");
  });
});

describe("encodeSms", () => {
  it("uses SMSTO when a message is present", () => {
    expect(encodeSms({ number: "+9665", message: "hey" })).toBe("SMSTO:+9665:hey");
  });
  it("falls back to a bare sms: link with no message", () => {
    expect(encodeSms({ number: "+9665" })).toBe("sms:+9665");
  });
});

describe("encodePhone", () => {
  it("prefixes tel:", () => {
    expect(encodePhone("+966500000000")).toBe("tel:+966500000000");
  });
});

describe("encodeWhatsapp", () => {
  it("strips non-digits from the phone and url-encodes the message", () => {
    expect(
      encodeWhatsapp({ phone: "+966 50 000 0000", message: "Hello world" })
    ).toBe("https://wa.me/966500000000?text=Hello%20world");
  });
  it("omits the text param when no message is given", () => {
    expect(encodeWhatsapp({ phone: "966500000000" })).toBe(
      "https://wa.me/966500000000"
    );
  });
});

describe("encodeAppLink", () => {
  it("passes the url through", () => {
    expect(encodeAppLink({ url: "https://apps.example/app" })).toBe(
      "https://apps.example/app"
    );
  });
  it("returns an empty string for a missing url", () => {
    expect(encodeAppLink({ url: "" })).toBe("");
  });
});
