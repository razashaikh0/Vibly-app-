import 'package:flutter/material.dart';

class ChatsScreen extends StatefulWidget {
  const ChatsScreen({super.key});

  @override
  State<ChatsScreen> createState() => _ChatsScreenState();
}

class _ChatsScreenState extends State<ChatsScreen> {
  static const _chats = <(String, String, bool)>[
    ('Family group', 'Lunar Circle: Friday room is on 🌙', true),
    ('Priya Nair', 'Come talk to me in the lounge 🌙', false),
    ('Sana Qureshi', '[Gift] Rose ×3', false),
    ('Omar Haddad', '[Voice] 0:12', false),
  ];
  String _query = '';
  bool _liveOnly = false;

  @override
  Widget build(BuildContext context) {
    final list = _chats.where((c) {
      final matchesQuery = c.$1.toLowerCase().contains(_query.toLowerCase());
      return matchesQuery && (!_liveOnly || c.$3);
    }).toList();
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Text('Chats', style: Theme.of(context).textTheme.headlineSmall),
        const SizedBox(height: 10),
        TextField(
          decoration: const InputDecoration(hintText: 'Search', prefixIcon: Icon(Icons.search)),
          onChanged: (v) => setState(() => _query = v),
        ),
        const SizedBox(height: 10),
        Row(
          children: [
            ChoiceChip(label: const Text('All chats'), selected: !_liveOnly, onSelected: (_) => setState(() => _liveOnly = false)),
            const SizedBox(width: 8),
            ChoiceChip(label: const Text('Live rooms'), selected: _liveOnly, onSelected: (_) => setState(() => _liveOnly = true)),
          ],
        ),
        const SizedBox(height: 8),
        for (final c in list)
          ListTile(
            leading: CircleAvatar(child: Text(c.$1[0])),
            title: Row(children: [
              if (c.$3) const Padding(padding: EdgeInsets.only(right: 6), child: CircleAvatar(radius: 4, backgroundColor: Color(0xFF22C55E))),
              Flexible(child: Text(c.$1, overflow: TextOverflow.ellipsis)),
            ]),
            subtitle: Text(c.$2, maxLines: 1, overflow: TextOverflow.ellipsis),
          ),
        if (list.isEmpty) const Padding(padding: EdgeInsets.all(24), child: Center(child: Text('No chats match.'))),
      ],
    );
  }
}
