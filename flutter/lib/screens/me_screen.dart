import 'package:flutter/material.dart';

class MeScreen extends StatelessWidget {
  const MeScreen({super.key});

  static const _rows = <(IconData, String)>[
    (Icons.diamond_outlined, 'VIP Center'),
    (Icons.storefront_outlined, 'Shop'),
    (Icons.account_balance_wallet_outlined, 'Wallet'),
    (Icons.shield_outlined, 'Family'),
    (Icons.photo_library_outlined, 'Moments'),
    (Icons.insights_outlined, 'Analytics'),
    (Icons.lock_outline, 'Privacy'),
    (Icons.security_outlined, 'Security'),
    (Icons.receipt_long_outlined, 'Activity log'),
    (Icons.settings_outlined, 'Settings'),
  ];

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        const CircleAvatar(radius: 36, child: Text('I', style: TextStyle(fontSize: 24))),
        const SizedBox(height: 10),
        Text('You', textAlign: TextAlign.center, style: Theme.of(context).textTheme.titleLarge),
        const Text('VIP 0', textAlign: TextAlign.center),
        const SizedBox(height: 16),
        for (final r in _rows)
          ListTile(
            leading: Icon(r.$1),
            title: Text(r.$2),
            trailing: const Icon(Icons.chevron_right),
            onTap: () {},
          ),
      ],
    );
  }
}
