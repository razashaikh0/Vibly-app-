import 'package:flutter/material.dart';

import '../models/room.dart';
import '../theme/vibely_theme.dart';

/// Voice/video/wedding/acquaintance room. Seats are local UI only: no audio yet.
class RoomScreen extends StatefulWidget {
  const RoomScreen({super.key, required this.room});

  final Room room;

  @override
  State<RoomScreen> createState() => _RoomScreenState();
}

class _RoomScreenState extends State<RoomScreen> {
  bool _micOn = true;

  @override
  Widget build(BuildContext context) {
    final room = widget.room;
    return Scaffold(
      appBar: AppBar(
        title: Text(room.name, overflow: TextOverflow.ellipsis),
        actions: [
          IconButton(
            tooltip: _micOn ? 'Mic on (demo, no audio)' : 'Mic off',
            icon: Icon(_micOn ? Icons.mic : Icons.mic_off),
            onPressed: () => setState(() => _micOn = !_micOn),
          ),
        ],
      ),
      body: Column(
        children: [
          Container(
            margin: const EdgeInsets.all(12),
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
            decoration: BoxDecoration(
              color: VibelyColors.soft,
              borderRadius: BorderRadius.circular(999),
            ),
            child: Text('${room.emoji} ${room.typeLabel} · Voice audio not connected yet'),
          ),
          Expanded(
            child: GridView.builder(
              padding: const EdgeInsets.all(16),
              gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
                crossAxisCount: 3,
                mainAxisSpacing: 16,
                crossAxisSpacing: 16,
              ),
              itemCount: 9,
              itemBuilder: (context, i) => _Seat(index: i, host: i == 0),
            ),
          ),
        ],
      ),
    );
  }
}

class _Seat extends StatelessWidget {
  const _Seat({required this.index, required this.host});

  final int index;
  final bool host;

  @override
  Widget build(BuildContext context) {
    final empty = index > 3;
    return Column(
      mainAxisSize: MainAxisSize.min,
      children: [
        Container(
          width: 64,
          height: 64,
          decoration: BoxDecoration(
            shape: BoxShape.circle,
            color: empty ? Colors.white : VibelyColors.neonPink.withValues(alpha: 0.25),
            border: Border.all(
              color: host ? VibelyColors.gold : VibelyColors.neonBlue,
              width: 2,
            ),
          ),
          child: Icon(empty ? Icons.add : Icons.person, color: VibelyColors.sub),
        ),
        const SizedBox(height: 4),
        Text(empty ? 'Empty' : (host ? 'Host' : 'Guest'), style: const TextStyle(fontSize: 12)),
      ],
    );
  }
}
