-- Bảng khách hàng
create table customers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null unique,
  note text,
  point float default 0,
  created_at timestamp with time zone default timezone('Asia/Ho_Chi_Minh', now())
);

-- Bảng đơn hàng
create table orders (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid references customers(id) on delete set null,
  customer_name text not null,
  customer_phone text not null,
  product text not null,
  amount float not null,
  status text not null default 'pending', -- 'pending', 'delivered', 'cancelled'
  created_at timestamp with time zone default timezone('Asia/Ho_Chi_Minh', now())
);

-- Index để tìm kiếm nhanh theo số điện thoại
create index idx_customers_phone on customers(phone);

-- Index cho đơn hàng theo ngày
create index idx_orders_created_at on orders(created_at);
create table admin (
  id uuid default uuid_generate_v4() primary key,
  username text unique not null,
  password text not null
);

insert into admin (username, password) values ('admin', 'admin123');
create table vouchers (
  id uuid primary key default gen_random_uuid(),
  code varchar(20) not null unique,
  discount integer not null, -- phần trăm giảm giá
  expired_at date not null,  -- ngày hết hạn
  status varchar(20) not null default 'active', -- 'active' hoặc 'expired'
  created_at timestamp with time zone default now()
);
ALTER TABLE orders ADD COLUMN customer_address TEXT;
ALTER TABLE orders ADD COLUMN final_amount INTEGER;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS voucher_code TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS voucher_discount INTEGER;