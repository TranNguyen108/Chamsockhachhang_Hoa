// filepath: src/scripts/sync_customers_from_orders.ts
// Script đồng bộ khách hàng từ bảng orders sang bảng customers
// Chạy script này 1 lần để đảm bảo mọi khách hàng trong orders đều có trong bảng customers

import { supabase } from '@/utils/supabase';

async function syncCustomersFromOrders() {
  // Lấy toàn bộ đơn hàng
  const { data: orders, error: orderError } = await supabase.from('orders').select('customer_name, customer_phone, customer_address');
  if (orderError) {
    console.error('Lỗi lấy orders:', orderError.message);
    return;
  }
  if (!orders) return;

  // Lấy toàn bộ số điện thoại khách hàng đã có
  const { data: customers, error: customerError } = await supabase.from('customers').select('phone');
  if (customerError) {
    console.error('Lỗi lấy customers:', customerError.message);
    return;
  }
  const existingPhones = new Set((customers || []).map(c => c.phone));

  // Lọc ra các khách hàng chưa có trong bảng customers
  const newCustomers = orders.filter(o => o.customer_phone && !existingPhones.has(o.customer_phone))
    .map(o => ({
      name: o.customer_name || 'Chưa rõ tên',
      phone: o.customer_phone,
      address: o.customer_address || '',
      point: 0
    }));

  if (newCustomers.length === 0) {
    console.log('Không có khách hàng mới cần thêm.');
    return;
  }

  // Thêm các khách hàng mới vào bảng customers
  const { error: insertError } = await supabase.from('customers').insert(newCustomers);
  if (insertError) {
    console.error('Lỗi khi thêm khách hàng:', insertError.message);
  } else {
    console.log(`Đã thêm ${newCustomers.length} khách hàng mới vào bảng customers.`);
  }
}

// Gọi hàm đồng bộ
syncCustomersFromOrders();
