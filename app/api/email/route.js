import { NextResponse } from 'next/server';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

const PROJECT_TYPES = {
  rear_extension: "Rear extension",
  side_extension: "Side extension",
  loft_conversion: "Loft conversion",
  outbuilding: "Outbuilding / shed / garden room",
  porch: "Porch",
  roof_alteration: "Roof alteration / dormer",
  driveway: "Driveway / hardstanding",
  fence_wall: "Fence or wall",
};

const verdictLabels = {
  permitted_development: "✅ Permitted Development",
  prior_approval: "⚠️ Prior Approval Required",
  planning_permission: "ℹ️ Planning Permission Required",
  likely_refused: "❌ Likely to be Refused",
};

export async function POST(request) {
  try {
    const { email, report, form } = await request.json();

    if (!email || !report) {
      return NextResponse.json({ error: 'Missing email or report' }, { status: 400 });
    }

    const projectLabel = PROJECT_TYPES[form.projectType] || form.projectType;
    const verdictLabel = verdictLabels[report.verdict] || report.verdict;
    const date = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

    const riskRows = report.riskFlags?.map(r =>
      `<tr>
        <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;">
          <span style="background:${r.level === 'high' ? '#fee2e2' : r.level === 'medium' ? '#fef3c7' : '#dcfce7'};color:${r.level === 'high' ? '#b91c1c' : r.level === 'medium' ? '#92400e' : '#166534'};padding:2px 8px;border-radius:20px;font-size:11px;font-weight:600;">${r.level}</span>
        </td>
        <td style="padding:8px 12px;border-bottom:1px solid #f0f0f0;font-size:13px;color:#444;">${r.flag}</td>
      </tr>`
    ).join('') || '<tr><td colspan="2" style="padding:8px 12px;color:#888;font-size:13px;">No significant risks identified.</td></tr>';

    const nextStepsHtml = report.nextSteps?.map((s, i) =>
      `<li style="margin-bottom:8px;font-size:13px;color:#444;line-height:1.6;">${s}</li>`
    ).join('') || '';

    const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f0;font-family:Georgia,'Times New Roman',serif;">
  <div style="max-width:600px;margin:40px auto;background:#fff;border-radius:8px;overflow:hidden;border:1px solid #e5e5e5;">
    
    <!-- Header -->
    <div style="background:#1a1a1a;padding:32px 40px;">
      <h1 style="margin:0;color:#fff;font-size:22px;font-weight:700;letter-spacing:-0.02em;">Planning Permission Assistant</h1>
      <p style="margin:6px 0 0;color:#999;font-size:13px;font-style:italic;">Your planning assessment report · ${date}</p>
    </div>

    <!-- Verdict -->
    <div style="padding:28px 40px;background:${report.verdict === 'permitted_development' ? '#dcfce7' : report.verdict === 'prior_approval' ? '#fef3c7' : report.verdict === 'likely_refused' ? '#fee2e2' : '#dbeafe'};">
      <h2 style="margin:0 0 8px;font-size:18px;color:${report.verdict === 'permitted_development' ? '#166534' : report.verdict === 'prior_approval' ? '#92400e' : report.verdict === 'likely_refused' ? '#b91c1c' : '#1e40af'};">${verdictLabel}</h2>
      <p style="margin:0;font-size:14px;color:#444;line-height:1.7;">${report.summary}</p>
      ${report.pdClass ? `<p style="margin:8px 0 0;font-size:11px;color:#888;text-transform:uppercase;letter-spacing:.06em;">GPDO ${report.pdClass} · Confidence: ${report.confidence}</p>` : ''}
    </div>

    <div style="padding:32px 40px;">

      <!-- Project details -->
      <table style="width:100%;border-collapse:collapse;margin-bottom:28px;">
        <tr><td style="padding:6px 0;font-size:12px;color:#888;width:120px;text-transform:uppercase;letter-spacing:.06em;">Project</td><td style="padding:6px 0;font-size:13px;color:#333;">${projectLabel}</td></tr>
        <tr><td style="padding:6px 0;font-size:12px;color:#888;text-transform:uppercase;letter-spacing:.06em;">Postcode</td><td style="padding:6px 0;font-size:13px;color:#333;">${form.postcode}</td></tr>
        <tr><td style="padding:6px 0;font-size:12px;color:#888;text-transform:uppercase;letter-spacing:.06em;">Property</td><td style="padding:6px 0;font-size:13px;color:#333;">${form.propertyType}</td></tr>
      </table>

      <!-- Key rules -->
      <h3 style="margin:0 0 12px;font-size:15px;color:#1a1a1a;border-bottom:1px solid #f0f0f0;padding-bottom:8px;">Key planning rules</h3>
      <ul style="margin:0 0 28px;padding-left:20px;">
        ${report.keyRules?.map(r => `<li style="margin-bottom:6px;font-size:13px;color:#444;line-height:1.6;">${r}</li>`).join('') || ''}
      </ul>

      <!-- Planning statement -->
      <h3 style="margin:0 0 12px;font-size:15px;color:#1a1a1a;border-bottom:1px solid #f0f0f0;padding-bottom:8px;">Planning Statement</h3>
      <p style="margin:0 0 8px;font-size:11px;color:#888;font-style:italic;">Suitable for submission to your Local Planning Authority</p>
      <p style="margin:0 0 28px;font-size:13px;color:#444;line-height:1.8;white-space:pre-wrap;">${report.planningStatement}</p>

      <!-- Risk flags -->
      <h3 style="margin:0 0 12px;font-size:15px;color:#1a1a1a;border-bottom:1px solid #f0f0f0;padding-bottom:8px;">Risk flags</h3>
      <table style="width:100%;border-collapse:collapse;margin-bottom:28px;">
        ${riskRows}
      </table>

      <!-- CIL -->
      ${report.cilAssessment ? `
      <h3 style="margin:0 0 12px;font-size:15px;color:#1a1a1a;border-bottom:1px solid #f0f0f0;padding-bottom:8px;">CIL Assessment</h3>
      <div style="background:#f8f8f8;border-radius:6px;padding:14px 16px;margin-bottom:28px;">
        <p style="margin:0 0 6px;font-size:13px;font-weight:600;color:#333;">Liability: ${report.cilAssessment.liable === true ? 'Potentially liable' : report.cilAssessment.liable === false ? 'Not liable' : 'Unknown'}</p>
        <p style="margin:0;font-size:13px;color:#555;line-height:1.6;">${report.cilAssessment.reason}</p>
        ${report.cilAssessment.selfBuildExemption ? '<p style="margin:8px 0 0;font-size:12px;color:#075985;font-weight:600;">⚠ Self-build exemption may be available — submit Form 7 before starting works</p>' : ''}
      </div>
      ` : ''}

      <!-- Next steps -->
      <h3 style="margin:0 0 12px;font-size:15px;color:#1a1a1a;border-bottom:1px solid #f0f0f0;padding-bottom:8px;">Recommended next steps</h3>
      <ol style="margin:0 0 28px;padding-left:20px;">${nextStepsHtml}</ol>

      <!-- CTA -->
      <div style="background:#f8f8f8;border-radius:6px;padding:20px;text-align:center;margin-bottom:20px;">
        <p style="margin:0 0 12px;font-size:13px;color:#555;">Need a qualified planning consultant to review this?</p>
        <a href="https://www.rtpi.org.uk/find-a-planner/" style="background:#1a1a1a;color:#fff;padding:10px 24px;border-radius:6px;text-decoration:none;font-size:13px;font-family:Georgia,serif;">Find a Planning Consultant →</a>
      </div>

      <!-- Disclaimer -->
      <p style="margin:0;font-size:11px;color:#999;line-height:1.6;font-style:italic;border-top:1px solid #f0f0f0;padding-top:16px;">${report.disclaimer}</p>
    </div>
  </div>
</body>
</html>`;

    await resend.emails.send({
      from: 'Planning Assistant <taiwoakintunde@gmail.com>',
      to: email,
      subject: `Your Planning Report — ${projectLabel} · ${form.postcode}`,
      html,
    });

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Email error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
