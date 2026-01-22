'use client';

export default function GuestFooter() {
  return (
    <footer className="bg-neutral-900 border-t border-neutral-800 mt-16">
      <div className="max-w-7xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Brand */}
        <div>
          <h3 className="font-extrabold text-xl mb-3 text-orange-500">CaffeeIn</h3>
          <p className="text-sm text-neutral-400 leading-relaxed">
            Fresh & healthy food delivered directly to your table with the best quality ingredients.
          </p>
        </div>

        {/* Menu */}
        <div>
          <h4 className="font-semibold mb-3 text-white">Menu</h4>
          <ul className="space-y-2 text-sm text-neutral-500">
            <li>All Products</li>
            <li>Makanan</li>
            <li>Minuman</li>
            <li>Dessert</li>
          </ul>
        </div>

        {/* Support */}
        <div>
          <h4 className="font-semibold mb-3 text-white">Support</h4>
          <ul className="space-y-2 text-sm text-neutral-500">
            <li>Help Center</li>
            <li>Payment</li>
            <li>Delivery</li>
            <li>FAQ</li>
          </ul>
        </div>

        {/* Legal */}
        <div>
          <h4 className="font-semibold mb-3 text-white">Company</h4>
          <ul className="space-y-2 text-sm text-neutral-500">
            <li>About Us</li>
            <li>Privacy Policy</li>
            <li>Terms & Conditions</li>
          </ul>
        </div>
      </div>

      <div className="text-center text-xs text-neutral-400 py-4 border-t border-neutral-800">
        © 2026 CaffeeIn. All rights reserved.
      </div>
    </footer>
  );
}