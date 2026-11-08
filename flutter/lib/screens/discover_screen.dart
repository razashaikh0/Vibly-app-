import 'package:flutter/material.dart';

import '../theme/vibely_theme.dart';

class DiscoverScreen extends StatefulWidget {
  const DiscoverScreen({super.key});

  @override
  State<DiscoverScreen> createState() => _DiscoverScreenState();
}

class _Person {
  const _Person(this.name, this.interests, this.lang, this.liveIn);
  final String name;
  final List<String> interests;
  final String lang;
  final String? liveIn;
}

class _DiscoverScreenState extends State<DiscoverScreen> {
  static const _mine = ['Music', 'Gaming'];
  static const _myLang = 'Hindi';
  static const _people = <_Person>[
    _Person('Zara Ahmed', ['Music', 'Gaming'], 'Hindi', 'Desi Dance Deck'),
    _Person('Omar Haddad', ['Cricket', 'Movies'], 'English', null),
    _Person('Lena Park', ['Music', 'Travel'], 'English', 'Late Night Chai ☕'),
    _Person('Priya Nair', ['Poetry', 'Music'], 'Hindi', null),
    _Person('Ayaan Khan', ['Gaming', 'Movies'], 'Hindi', 'PK Arena'),
  ];
  bool _liveOnly = false;
  final Set<String> _hidden = {};

  /// Same scoring idea as the web preview: shared interests + language.
  int _match(_Person p) {
    final shared = p.interests.where(_mine.contains).length;
    return (40 + shared * 18 + (p.lang == _myLang ? 10 : 0)).clamp(0, 97);
  }

  @override
  Widget build(BuildContext context) {
    final list = _people
        .where((p) => !_hidden.contains(p.name) && (!_liveOnly || p.liveIn != null))
        .toList()
      ..sort((a, b) => _match(b).compareTo(_match(a)));
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Text('Discover', style: Theme.of(context).textTheme.headlineSmall),
        const SizedBox(height: 10),
        Row(children: [
          ChoiceChip(label: const Text('For You'), selected: !_liveOnly, onSelected: (_) => setState(() => _liveOnly = false)),
          const SizedBox(width: 8),
          ChoiceChip(label: const Text('Live Now'), selected: _liveOnly, onSelected: (_) => setState(() => _liveOnly = true)),
        ]),
        const SizedBox(height: 12),
        for (final p in list)
          Card(
            child: Padding(
              padding: const EdgeInsets.all(14),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(children: [
                    CircleAvatar(child: Text(p.name[0])),
                    const SizedBox(width: 12),
                    Expanded(child: Text(p.name, style: const TextStyle(fontWeight: FontWeight.w800))),
                    Text('${_match(p)}%', style: TextStyle(fontWeight: FontWeight.w900, color: VibelyColors.neonPink)),
                  ]),
                  const SizedBox(height: 6),
                  Text(p.liveIn != null ? 'In ${p.liveIn}' : 'Offline', style: const TextStyle(color: VibelyColors.sub)),
                  const SizedBox(height: 6),
                  Wrap(spacing: 6, children: [for (final i in p.interests) Chip(label: Text(i), visualDensity: VisualDensity.compact)]),
                  Row(children: [
                    TextButton(onPressed: () {}, child: const Text('Follow')),
                    TextButton(onPressed: () {}, child: const Text('Profile')),
                    const Spacer(),
                    TextButton(
                      onPressed: () => setState(() => _hidden.add(p.name)),
                      child: const Text('Not interested'),
                    ),
                  ]),
                ],
              ),
            ),
          ),
      ],
    );
  }
}
