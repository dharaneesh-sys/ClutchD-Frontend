import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  escapeHtml,
  sanitizeFilename,
  buildDocumentHtml,
  triggerFileDownload,
  downloadPaymentReceipt,
  downloadOrderReceipt,
  downloadJobInvoice,
  buildJobInvoiceText,
} from "../documentDownload";

let capturedBlob = null;
let clickSpy = null;

beforeEach(() => {
  capturedBlob = null;
  window.URL.createObjectURL = vi.fn((blob) => {
    capturedBlob = blob;
    return "blob:mock-url";
  });
  window.URL.revokeObjectURL = vi.fn();
  clickSpy = vi
    .spyOn(window.HTMLAnchorElement.prototype, "click")
    .mockImplementation(() => {});
});

afterEach(() => {
  clickSpy.mockRestore();
  vi.restoreAllMocks();
});

async function blobText() {
  expect(capturedBlob).toBeInstanceOf(Blob);
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsText(capturedBlob);
  });
}

describe("escapeHtml", () => {
  it("escapes markup characters", () => {
    expect(escapeHtml('<b>&"\''))
      .toBe("&lt;b&gt;&amp;&quot;&#39;");
  });
});

describe("sanitizeFilename", () => {
  it("replaces unsafe characters", () => {
    expect(sanitizeFilename("receipt/12 34.pdf")).toBe("receipt_12_34.pdf");
  });

  it("falls back when empty", () => {
    expect(sanitizeFilename("///", "document")).toBe("document");
  });
});

describe("buildDocumentHtml", () => {
  it("embeds title and rows with escaping", () => {
    const html = buildDocumentHtml({
      title: "Receipt <x>",
      rows: [["Amount", "\u20B9100"]],
    });
    expect(html).toContain("Receipt &lt;x&gt;");
    expect(html).toContain("\u20B9100");
  });
});

describe("triggerFileDownload", () => {
  it("appends an anchor with the download attribute and cleans up", () => {
    const name = triggerFileDownload({ filename: "receipt_ab12.html", content: "<h1>hi</h1>" });
    expect(name).toBe("receipt_ab12.html");
    expect(clickSpy).toHaveBeenCalledTimes(1);
    expect(window.URL.revokeObjectURL).toHaveBeenCalledWith("blob:mock-url");
    expect(document.querySelector('a[download="receipt_ab12.html"]')).toBeNull();
  });
});

describe("downloadPaymentReceipt", () => {
  it("downloads a file containing the payment data", async () => {
    const name = downloadPaymentReceipt({
      id: "pay_123456789",
      amount: 499,
      method: "upi",
      provider: "razorpay",
      transactionId: "txn_abc123",
      status: "completed",
      created_at: "2026-01-15T10:30:00.000Z",
    });
    expect(name).toBe("receipt_pay_1234.html");
    const html = await blobText();
    expect(html).toContain("upi");
    expect(html).toContain("txn_abc123");
    expect(html).toContain("499");
  });

  it("tolerates missing fields", async () => {
    const name = downloadPaymentReceipt({});
    expect(name).toBe("receipt_unknown.html");
    const html = await blobText();
    expect(html).toContain("Payment Receipt");
  });
});

describe("downloadOrderReceipt", () => {
  it("downloads a file containing the order data", async () => {
    const name = downloadOrderReceipt({
      id: "order_abcdef123456",
      issue_tag: "flat_tire",
      status: "completed",
      created_at: "2026-02-01T09:00:00.000Z",
      total_amount: 1200,
      description: "Fixed on the highway",
      assigned_mechanic: { name: "Ravi" },
      pricing: { serviceAmount: 1000, convenienceFee: 40, gstAmount: 160, totalAmount: 1200 },
    });
    expect(name).toBe("receipt_order_ab.html");
    const html = await blobText();
    expect(html).toContain("flat_tire");
    expect(html).toContain("Ravi");
    expect(html).toContain("Grand Total");
  });
});

describe("downloadJobInvoice", () => {
  it("downloads a file containing the job pricing", async () => {
    const job = {
      id: "job_99998888aaaa",
      issueTag: "engine_failure",
      status: "completed",
      createdAt: "2026-03-10T12:00:00.000Z",
      description: "Engine overhaul",
      mechanic: { name: "Meena" },
      pricing: {
        serviceAmount: 2000,
        convenienceFee: 40,
        cancellationFee: 0,
        distanceKm: 3.2,
        distanceFee: 96,
        gstAmount: 367.2,
        totalAmount: 2503.2,
      },
    };
    const name = downloadJobInvoice(job);
    expect(name).toBe("invoice_job_9999.html");
    const html = await blobText();
    expect(html).toContain("engine_failure");
    expect(html).toContain("Meena");
    expect(html).toContain("Grand Total");
  });

  it("builds a plain-text body for email sharing", () => {
    const body = buildJobInvoiceText({
      id: "job_99998888aaaa",
      issueTag: "engine_failure",
      status: "completed",
      pricing: { serviceAmount: 2000, totalAmount: 2503.2 },
    });
    expect(body).toContain("Invoice #JOB_9999");
    expect(body).toContain("engine_failure");
    expect(body).toContain("Grand Total:");
    expect(body).not.toContain("/api/jobs/history");
  });
});
