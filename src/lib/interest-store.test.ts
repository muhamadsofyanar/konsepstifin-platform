import { describe, expect, it } from 'vitest';
import {
  calculateMargin,
  mapLead,
  promoterCandidateStatuses,
  sanitizeCampaignValue,
  testServiceStatuses,
  validateIdempotencyKey,
  validateInterestInput,
  validateLeadAdminUpdate,
} from './interest-store';

const validTestLead = {
  leadType: 'test_service',
  name: 'Budi Santoso',
  phone: '081234567890',
  email: 'budi@example.com',
  provinceCode: '32',
  provinceName: 'Jawa Barat',
  regencyCode: '32.04',
  regencyName: 'Kabupaten Bandung',
  city: 'Kabupaten Bandung',
  service: 'Tes STIFIn Personal',
  productKey: 'tesPersonal',
  notes: '',
  sourcePath: '/tes-stifin',
  consentToContact: true,
  consentToShare: true,
};

describe('interest-store domain', () => {
  it('menormalisasi lead tes beserta idempotency key', () => {
    expect(validateInterestInput(validTestLead)).toMatchObject({
      leadType: 'test_service',
      phone: '6281234567890',
      email: 'budi@example.com',
      productKey: 'tesPersonal',
    });
    expect(() => validateInterestInput({ ...validTestLead, email: 'bukan-email' })).toThrow('Email belum valid.');
    expect(() => validateIdempotencyKey('abc')).toThrow('Identitas formulir tidak valid.');
    expect(validateIdempotencyKey('123e4567-e89b-42d3-a456-426614174000'))
      .toBe('123e4567-e89b-42d3-a456-426614174000');
  });

  it('menerapkan consent yang berbeda tanpa mencampurkan layanan', () => {
    expect(() => validateInterestInput({ ...validTestLead, consentToShare: false }))
      .toThrow('Persetujuan pembagian terbatas');
    expect(validateInterestInput({
      ...validTestLead,
      leadType: 'promoter_candidate',
      productKey: 'wsl1',
      service: 'WSL 1',
      consentToShare: false,
    })).toMatchObject({ leadType: 'promoter_candidate', consentToShare: false });
    expect(() => validateInterestInput({
      ...validTestLead,
      leadType: 'promoter_candidate',
      productKey: 'tesPersonal',
    })).toThrow('Layanan tidak sesuai');
  });

  it('memisahkan status admin per jenis lead dan menyaring attribution', () => {
    expect(testServiceStatuses).toContain('dijadwalkan');
    expect(promoterCandidateStatuses).toContain('mengikuti_preview');
    expect(() => validateLeadAdminUpdate({ leadType: 'promoter_candidate', status: 'dijadwalkan' }))
      .toThrow('Status tidak sesuai');
    expect(sanitizeCampaignValue('  meta<script>  ')).toBe('metascript');
  });

  it('menghitung margin dan menolak nominal negatif', () => {
    expect(calculateMargin({ saleAmount: 650001, promoterPayout: 500000, otherCost: 25000 })).toBe(125001);
    expect(() => validateLeadAdminUpdate({
      leadType: 'test_service', status: 'selesai', paymentStatus: 'dibayar', saleAmount: -1,
    })).toThrow('Nilai penjualan tidak boleh negatif.');
  });

  it('memetakan bigint database menjadi number aman tanpa menyimpan margin', () => {
    const lead = mapLead({
      id: 7,
      lead_type: 'test_service',
      name: 'Budi',
      phone: '6281',
      email: 'budi@example.com',
      province_code: '32',
      province_name: 'Jawa Barat',
      regency_code: '32.04',
      regency_name: 'Kabupaten Bandung',
      city: 'Bandung',
      service: 'Tes',
      product_key: 'tesPersonal',
      notes: '',
      source_path: '/tes-stifin',
      consent_to_contact: true,
      consent_to_share: true,
      status: 'ditawarkan',
      assigned_promoter_code: 'P-1',
      pic: '',
      match_method: 'area',
      matched_promoter_name: 'Siti',
      matched_branch_code: 'BDG-CAB-1',
      payment_status: 'dibayar',
      sejoli_order_id: 'ORD-1',
      sale_amount: '650001',
      promoter_payout: '500000',
      other_cost: '25000',
      response_due_at: new Date(0),
      consent_at: new Date(0),
      scheduled_at: null,
      payment_checked_at: new Date(0),
      internal_notes: '',
      idempotency_key: '123e4567-e89b-42d3-a456-426614174000',
      utm_source: 'meta',
      utm_medium: '',
      utm_campaign: '',
      utm_content: '',
      utm_term: '',
      referrer: '',
      created_at: new Date(0),
      updated_at: new Date(0),
    });
    expect(lead.margin).toBe(125001);
    expect(lead.matchMethod).toBe('area');
    expect(lead.leadType).toBe('test_service');
  });
});
