import 'package:flutter/material.dart';

import '../theme/vibely_theme.dart';

class GamesScreen extends StatefulWidget {
  const GamesScreen({super.key});

  @override
  State<GamesScreen> createState() => _GamesScreenState();
}

class _GamesScreenState extends State<GamesScreen> {
  static const _cats = ['All', 'Social', 'Party', 'Voice', 'Cards', 'Classic', 'Couple'];
  static const _games = <(String, String, String)>[
    ("Who's the Spy", '🕵️', 'Party'),
    ('Truth or Dare', '🫣', 'Social'),
    ('Sing Along', '🎵', 'Voice'),
    ('Uno Blitz', '🎴', 'Cards'),
    ('Classic Chess', '♞', 'Classic'),
    ('Couple Games', '💞', 'Couple'),
  ];
  String _cat = 'All';

  @override
  Widget build(BuildContext context) {
    final list = _games.where((g) => _cat == 'All' || g.$3 == _cat).toList();
    return ListView(
      padding: const EdgeInsets.all(16),
      children: [
        Text('What are we playing?', style: Theme.of(context).textTheme.titleLarge),
        const SizedBox(height: 12),
        SizedBox(
          height: 40,
          child: ListView(
            scrollDirection: Axis.horizontal,
            children: [
              for (final c in _cats)
                Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: ChoiceChip(
                    label: Text(c),
                    selected: _cat == c,
                    selectedColor: VibelyColors.neonBlue.withValues(alpha: 0.3),
                    onSelected: (_) => setState(() => _cat = c),
                  ),
                ),
            ],
          ),
        ),
        const SizedBox(height: 12),
        for (final g in list)
          Card(
            child: ListTile(
              leading: Text(g.$2, style: const TextStyle(fontSize: 26)),
              title: Text(g.$1, style: const TextStyle(fontWeight: FontWeight.w800)),
              subtitle: Text(g.$3),
              onTap: () => ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Game play arrives in the next phase')),
              ),
            ),
          ),
      ],
    );
  }
}
