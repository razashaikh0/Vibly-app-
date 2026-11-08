enum RoomType { voice, video, wedding, acquaintance }

class Room {
  const Room({
    required this.name,
    required this.people,
    required this.tag,
    required this.type,
    this.locked = false,
  });

  final String name;
  final int people;
  final String tag;
  final RoomType type;
  final bool locked;

  String get typeLabel => switch (type) {
        RoomType.voice => 'Voice room',
        RoomType.video => 'Video room',
        RoomType.wedding => 'Wedding room',
        RoomType.acquaintance => 'Acquaintance room',
      };

  String get emoji => switch (type) {
        RoomType.voice => '🎙️',
        RoomType.video => '📹',
        RoomType.wedding => '💒',
        RoomType.acquaintance => '💞',
      };
}

/// Sample rooms, same names as the web preview. Replace with server data later.
const sampleRooms = <Room>[
  Room(name: 'Late Night Chai ☕', people: 24, tag: 'Chat', type: RoomType.voice),
  Room(name: 'PK Arena', people: 47, tag: 'Official', type: RoomType.voice),
  Room(name: 'Desi Dance Deck', people: 373, tag: 'Music', type: RoomType.voice),
  Room(name: "Shaadi Mubarak 💍", people: 12, tag: 'Wedding', type: RoomType.wedding),
  Room(name: 'Video Chat Room', people: 9, tag: 'Video', type: RoomType.video),
  Room(name: 'Circle Of Friends', people: 6, tag: 'Friends', type: RoomType.acquaintance, locked: true),
];
