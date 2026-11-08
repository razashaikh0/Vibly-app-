import 'package:flutter/material.dart';

import '../models/room.dart';
import '../theme/vibely_theme.dart';
import 'room_screen.dart';

class RoomsScreen extends StatelessWidget {
  const RoomsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final totalPeople = sampleRooms.fold<int>(0, (a, r) => a + r.people);
    return CustomScrollView(
      slivers: [
        SliverPadding(
          padding: const EdgeInsets.fromLTRB(16, 12, 16, 0),
          sliver: SliverToBoxAdapter(
            child: Container(
              padding: const EdgeInsets.all(14),
              decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(16),
                gradient: const LinearGradient(colors: [Color(0xFFEAF6FF), Color(0xFFFFE9F4)]),
              ),
              child: Row(
                children: [
                  Expanded(
                    child: Text(
                      'Live now · ${sampleRooms.length} rooms · $totalPeople people',
                      style: const TextStyle(fontWeight: FontWeight.w800),
                    ),
                  ),
                  FilledButton.tonal(onPressed: () {}, child: const Text('+ Create')),
                ],
              ),
            ),
          ),
        ),
        SliverPadding(
          padding: const EdgeInsets.all(16),
          sliver: SliverList.separated(
            itemCount: sampleRooms.length,
            separatorBuilder: (_, __) => const SizedBox(height: 10),
            itemBuilder: (context, i) => _RoomTile(room: sampleRooms[i]),
          ),
        ),
      ],
    );
  }
}

class _RoomTile extends StatelessWidget {
  const _RoomTile({required this.room});

  final Room room;

  @override
  Widget build(BuildContext context) {
    return Card(
      child: ListTile(
        contentPadding: const EdgeInsets.all(12),
        leading: CircleAvatar(
          radius: 26,
          backgroundColor: VibelyColors.soft,
          child: Text(room.emoji, style: const TextStyle(fontSize: 22)),
        ),
        title: Text(room.name, style: const TextStyle(fontWeight: FontWeight.w800), overflow: TextOverflow.ellipsis),
        subtitle: Text('${room.tag} · ${room.typeLabel} · ${room.people} in voice'),
        trailing: room.locked ? const Icon(Icons.lock_outline) : const Icon(Icons.chevron_right),
        onTap: () => Navigator.of(context).push(
          MaterialPageRoute(builder: (_) => RoomScreen(room: room)),
        ),
      ),
    );
  }
}
