import test from 'node:test';
import assert from 'node:assert/strict';
import { roofingCompanyConfig } from '../src/config/roofingCompany.ts';

test('Roofing configuration contains required company credentials', () => {
  const { company, contact } = roofingCompanyConfig;
  assert.ok(company.name, 'Company name must be defined');
  assert.ok(company.licenseNumber, 'Company license number must be defined');
  assert.ok(contact.phone, 'Contact phone must be defined');
  assert.ok(contact.email, 'Contact email must be defined');
});

test('Roofing configuration defines all three required Whop plans', () => {
  const { plans } = roofingCompanyConfig.whop;

  // 1. Roof Inspection (~$149)
  assert.ok(plans.roofInspection, 'roofInspection plan must be configured');
  assert.equal(plans.roofInspection.amount, 149);
  assert.equal(plans.roofInspection.billingType, 'one_time');
  assert.match(plans.roofInspection.checkoutUrl, /^https:\/\/whop\.com\/checkout\/plan_/, 'roofInspection must have a valid checkout URL');

  // 2. Project Deposit (~$500)
  assert.ok(plans.projectDeposit, 'projectDeposit plan must be configured');
  assert.equal(plans.projectDeposit.amount, 500);
  assert.equal(plans.projectDeposit.billingType, 'one_time');
  assert.equal(plans.projectDeposit.mode, 'setup');
  assert.match(plans.projectDeposit.checkoutUrl, /^https:\/\/whop\.com\/checkout\/plan_/, 'projectDeposit must have a valid checkout URL');

  // 3. Flat-Rate Service
  assert.ok(plans.flatRateService, 'flatRateService plan must be configured');
  assert.ok(plans.flatRateService.amount > 0);
  assert.equal(plans.flatRateService.billingType, 'one_time');
  assert.match(plans.flatRateService.checkoutUrl, /^https:\/\/whop\.com\/checkout\/plan_/, 'flatRateService must have a valid checkout URL');
});

test('Roofing configuration services list contains required service offerings', () => {
  const { services } = roofingCompanyConfig;
  const slugs = services.map((s) => s.slug);

  assert.ok(slugs.includes('roof-inspection'), 'Must include roof inspection');
  assert.ok(slugs.includes('roof-repair'), 'Must include roof repair');
  assert.ok(slugs.includes('roof-replacement'), 'Must include roof replacement');

  for (const service of services) {
    assert.ok(service.title, 'Service must have title');
    assert.ok(service.description, 'Service must have description');
    assert.ok(service.benefits.length > 0, 'Service must have benefits');
    assert.ok(service.detailedScope.length > 0, 'Service must have detailedScope');
    assert.match(service.checkoutUrl || '', /^https:\/\/whop\.com\/checkout\/plan_/, 'Service must have valid checkoutUrl');
  }
});
