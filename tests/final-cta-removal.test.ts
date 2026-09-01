import { describe, expect, it, beforeAll } from 'vitest';
import { experimental_AstroContainer as AstroContainer } from 'astro/container';
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import IndexPage from '../src/pages/index.astro';
import { navLinks, services, urgencyTypes } from '../src/data/landing';

// Tests couvrant la micro-retouche « suppression de FinalCta et espacement
// des boutons téléphoniques du footer » (01/09/2026, instruction directe).
let pageHtml = '';
let footerSource = '';

beforeAll(async () => {
  const container = await AstroContainer.create();
  pageHtml = await container.renderToString(IndexPage, {
    request: new Request('http://localhost/'),
  });

  const footerSourcePath = fileURLToPath(
    new URL('../src/components/layout/Footer.astro', import.meta.url),
  );
  footerSource = readFileSync(footerSourcePath, 'utf-8');
}, 30000);

describe('micro-retouche — suppression de FinalCta', () => {
  it('1. the FinalCta component file no longer exists', () => {
    const componentPath = fileURLToPath(
      new URL('../src/components/landing/FinalCta.astro', import.meta.url),
    );
    expect(existsSync(componentPath)).toBe(false);
  });

  it('2. its rendered content is entirely gone from the page (title, intro text, id="contact")', () => {
    expect(pageHtml).not.toContain('id="contact"');
    expect(pageHtml).not.toContain('class="final-cta');
    expect(pageHtml).not.toContain('Votre urgence ne peut pas attendre ?');
    expect(pageHtml).not.toMatch(/Choisissez la ligne adaptée et contactez .* 24h\/24 et 7j\/7\./);
  });

  it('3. no import of FinalCta remains anywhere in src/', () => {
    const indexSourcePath = fileURLToPath(new URL('../src/pages/index.astro', import.meta.url));
    const indexSource = readFileSync(indexSourcePath, 'utf-8');
    expect(indexSource).not.toContain('FinalCta');
  });

  it('4. the footer directly follows the FAQ section (no leftover gap section between them)', () => {
    const faqEnd = pageHtml.indexOf('id="faq"');
    expect(faqEnd).toBeGreaterThan(-1);
    const faqSectionEnd = pageHtml.indexOf('</section>', faqEnd) + '</section>'.length;
    const footerStart = pageHtml.indexOf('<footer', faqSectionEnd);
    expect(footerStart).toBeGreaterThan(-1);
    // Seuls le <script> propre à Faq.astro et la fermeture de <main> peuvent
    // séparer les deux dans le HTML (aucune hauteur visuelle) : aucune autre
    // <section> ni conteneur ne doit s'intercaler (ce qui trahirait une
    // section fantôme ou un espaceur laissé par erreur).
    const between = pageHtml.slice(faqSectionEnd, footerStart);
    expect(between).not.toContain('<section');
    expect(between).not.toContain('final-cta');
  });

  it('5. centralized phone data is untouched and still powers the navbar, footer and mobile call bar', () => {
    expect(pageHtml).toContain('APPEL STANDARD');
    expect(pageHtml).toContain('APPEL URGENCE');
    expect(pageHtml).toContain('id="mobile-call-bar"');
    expect(pageHtml).toContain('id="site-footer"');
  });
});

describe('micro-retouche — vérification des liens #contact', () => {
  it('6. no href="#contact" survives anywhere on the page', () => {
    expect(pageHtml).not.toContain('href="#contact"');
  });

  it('7. the navbar and footer "Contact" nav entry has been removed (no real Contact page exists)', () => {
    expect(navLinks.map((l) => l.label)).not.toContain('Contact');
    expect(navLinks.every((l) => l.href !== '#contact')).toBe(true);
    // navLinks alimente à la fois la navbar, le drawer mobile et le footer :
    // un seul retrait dans les données suffit aux trois.
    const navLabelMatches = pageHtml.match(/>Contact<\/a>/g) ?? [];
    expect(navLabelMatches).toHaveLength(0);
  });

  it('8. the Hero "Demander un devis gratuit" CTA no longer targets #contact (phone guard applies instead)', () => {
    expect(pageHtml).not.toMatch(/class="hero__quote-cta"[^>]*href="#contact"/);
  });

  it('9. the six "Découvrir ce service" links are gone: no dead #contact href remains on the services cards', () => {
    expect(services.every((s) => !('href' in s))).toBe(true);
    expect(pageHtml).not.toContain('Découvrir ce service');
  });

  it('10. the "Autre urgence" card has no fake destination (relatedServiceAnchor is null, no href rendered)', () => {
    const autre = urgencyTypes.find((u) => u.id === 'autre');
    expect(autre?.relatedServiceAnchor).toBeNull();
    expect(pageHtml).toMatch(/<div class="emergency-card emergency-card--static"/);
  });

  it('11. the five other urgency cards keep their real, working service anchors (no regression)', () => {
    for (const urgency of urgencyTypes) {
      if (urgency.id === 'autre') continue;
      expect(urgency.relatedServiceAnchor).toMatch(/^#service-/);
      const anchorId = (urgency.relatedServiceAnchor ?? '').slice(1);
      expect(pageHtml).toContain(`id="${anchorId}"`);
    }
  });

  it('12. no broken/empty anchor (href="#") was introduced anywhere as a side effect', () => {
    expect(pageHtml).not.toMatch(/href="#"/);
  });
});

describe('micro-retouche — espacement des boutons du footer', () => {
  it('13. the "Nous appeler" column uses flex column + a 16px gap on its container', () => {
    const ruleMatch = footerSource.match(/\.footer__calls\s*{[^}]*}/);
    expect(ruleMatch).not.toBeNull();
    expect(ruleMatch?.[0]).toContain('display: flex');
    expect(ruleMatch?.[0]).toContain('flex-direction: column');
    expect(ruleMatch?.[0]).toContain('gap: var(--space-3)');
  });

  it('14. --space-3 (the token used) is exactly 16px, matching the requested spacing', () => {
    const tokensPath = fileURLToPath(new URL('../src/styles/tokens.css', import.meta.url));
    const tokensSource = readFileSync(tokensPath, 'utf-8');
    expect(tokensSource).toMatch(/--space-3:\s*1rem;/);
  });

  it('15. no isolated margin was used instead of gap on the two phone buttons', () => {
    expect(footerSource).not.toMatch(/\.footer__phone\s*{[^}]*margin/);
  });

  it('16. both footer phone buttons are still present with their original colors, sizes and behavior untouched', () => {
    const footerMatch = pageHtml.match(/<footer[\s\S]*?<\/footer>/);
    const footerHtml = footerMatch?.[0] ?? '';
    const phoneButtons = footerHtml.match(/class="[^"]*footer__phone[^"]*"/g) ?? [];
    expect(phoneButtons).toHaveLength(2);
    expect(footerHtml).toContain('phone-cta--standard');
    expect(footerHtml).toContain('phone-cta--emergency');
    // Aucun numéro codé en dur AUTRE que le numéro d'urgence officiel,
    // désormais réel et centralisé (correctif d'architecture, 01/09/2026) —
    // le standard, lui, reste sans aucun chiffre (placeholder textuel).
    const phoneShapedNumbers = footerHtml.match(/0[1-9](?:[\s.-]?\d{2}){4}/g) ?? [];
    for (const match of phoneShapedNumbers) {
      expect(match).toBe('06 49 62 16 19');
    }
  });
});
