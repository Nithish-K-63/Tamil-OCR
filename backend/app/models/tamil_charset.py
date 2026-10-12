"""
Tamil Character Set & Unicode Mapping (156 classes).
Corresponds strictly to the standardized uTHCD (Unconstrained Tamil Handwritten Character Database)
benchmark as published by Shaffi & Hajamohideen (IEEE Access 2021, Appendix A1).
Matches the training classes and output dimension of TamilCNN (tamil_best.pth).
"""

# The canonical 156 classes from uTHCD Appendix A1
TAMIL_156_CLASSES = [
    "\u0BBE",          # 0: ா (Kaal vowel sign)
    "\u0B85",          # 1: அ
    "\u0B86",          # 2: ஆ
    "\u0B87",          # 3: இ
    "\u0B88",          # 4: ஈ
    "\u0B89",          # 5: உ
    "\u0B8A",          # 6: ஊ
    "\u0B8E",          # 7: எ
    "\u0B8F",          # 8: ஏ
    "\u0B90",          # 9: ஐ
    "\u0B92",          # 10: ஒ
    "\u0B93",          # 11: ஓ
    "\u0B94",          # 12: ஔ
    "\u0B83",          # 13: ஃ (Aytham)
    "\u0B95\u0BCD",    # 14: க்
    "\u0B95",          # 15: க
    "\u0B95\u0BBF",    # 16: கி
    "\u0B95\u0BC0",    # 17: கீ
    "\u0B95\u0BC1",    # 18: கு
    "\u0B95\u0BC2",    # 19: கூ
    "\u0B9A\u0BCD",    # 20: ச்
    "\u0B9A",          # 21: ச
    "\u0B9A\u0BBF",    # 22: சி
    "\u0B9A\u0BC0",    # 23: சீ
    "\u0B9A\u0BC1",    # 24: சு
    "\u0B9A\u0BC2",    # 25: சூ
    "\u0B99\u0BCD",    # 26: ங்
    "\u0B99",          # 27: ங
    "\u0B99\u0BBF",    # 28: ஙி
    "\u0B99\u0BC0",    # 29: ஙீ
    "\u0B99\u0BC1",    # 30: ஙு
    "\u0B99\u0BC2",    # 31: ஙூ
    "\u0B9E\u0BCD",    # 32: ஞ்
    "\u0B9E",          # 33: ஞ
    "\u0B9E\u0BBF",    # 34: ஞி
    "\u0B9E\u0BC0",    # 35: ஞீ
    "\u0B9E\u0BC1",    # 36: ஞு
    "\u0B9E\u0BC2",    # 37: ஞூ
    "\u0B9F\u0BCD",    # 38: ட்
    "\u0B9F",          # 39: ட
    "\u0B9F\u0BBF",    # 40: டி
    "\u0B9F\u0BC0",    # 41: டீ
    "\u0B9F\u0BC1",    # 42: டு
    "\u0B9F\u0BC2",    # 43: டூ
    "\u0BA3\u0BCD",    # 44: ண்
    "\u0BA3",          # 45: ண
    "\u0BA3\u0BBF",    # 46: ணி
    "\u0BA3\u0BC0",    # 47: ணீ
    "\u0BA3\u0BC1",    # 48: ணு
    "\u0BA3\u0BC2",    # 49: ணூ
    "\u0BA4\u0BCD",    # 50: த்
    "\u0BA4",          # 51: த
    "\u0BA4\u0BBF",    # 52: தி
    "\u0BA4\u0BC0",    # 53: தீ
    "\u0BA4\u0BC1",    # 54: து
    "\u0BA4\u0BC2",    # 55: தூ
    "\u0BA8\u0BCD",    # 56: ந்
    "\u0BA8",          # 57: ந
    "\u0BA8\u0BBF",    # 58: நி
    "\u0BA8\u0BC0",    # 59: நீ
    "\u0BA8\u0BC1",    # 60: நு
    "\u0BA8\u0BC2",    # 61: நூ
    "\u0BAA\u0BCD",    # 62: ப்
    "\u0BAA",          # 63: ப
    "\u0BAA\u0BBF",    # 64: பி
    "\u0BAA\u0BC0",    # 65: பீ
    "\u0BAA\u0BC1",    # 66: பு
    "\u0BAA\u0BC2",    # 67: பூ
    "\u0BAE\u0BCD",    # 68: ம்
    "\u0BAE",          # 69: ம
    "\u0BAE\u0BBF",    # 70: மி
    "\u0BAE\u0BC0",    # 71: மீ
    "\u0BAE\u0BC1",    # 72: மு
    "\u0BAE\u0BC2",    # 73: மூ
    "\u0BAF\u0BCD",    # 74: ய்
    "\u0BAF",          # 75: ய
    "\u0BAF\u0BBF",    # 76: யி
    "\u0BAF\u0BC0",    # 77: யீ
    "\u0BAF\u0BC1",    # 78: யு
    "\u0BAF\u0BC2",    # 79: யூ
    "\u0BB0\u0BCD",    # 80: ர்
    "\u0BB0",          # 81: ர
    "\u0BB0\u0BBF",    # 82: ரி
    "\u0BB0\u0BC0",    # 83: ரீ
    "\u0BB0\u0BC1",    # 84: ரு
    "\u0BB0\u0BC2",    # 85: ரூ
    "\u0BB2\u0BCD",    # 86: ல்
    "\u0BB2",          # 87: ல
    "\u0BB2\u0BBF",    # 88: லி
    "\u0BB2\u0BC0",    # 89: லீ
    "\u0BB2\u0BC1",    # 90: லு
    "\u0BB2\u0BC2",    # 91: லூ
    "\u0BB3\u0BCD",    # 92: ள்
    "\u0BB3",          # 93: ள
    "\u0BB3\u0BBF",    # 94: ளி
    "\u0BB3\u0BC0",    # 95: ளீ
    "\u0BB3\u0BC1",    # 96: ளு
    "\u0BB3\u0BC2",    # 97: ளூ
    "\u0BB1\u0BCD",    # 98: ற்
    "\u0BB1",          # 99: ற
    "\u0BB1\u0BBF",    # 100: றி
    "\u0BB1\u0BC0",    # 101: றீ
    "\u0BB1\u0BC1",    # 102: று
    "\u0BB1\u0BC2",    # 103: றூ
    "\u0BB5\u0BCD",    # 104: வ்
    "\u0BB5",          # 105: வ
    "\u0BB5\u0BBF",    # 106: வி
    "\u0BB5\u0BC0",    # 107: வீ
    "\u0BB5\u0BC1",    # 108: வு
    "\u0BB5\u0BC2",    # 109: வூ
    "\u0BB4\u0BCD",    # 110: ழ்
    "\u0BB4",          # 111: ழ
    "\u0BB4\u0BBF",    # 112: ழி
    "\u0BB4\u0BC0",    # 113: ழீ
    "\u0BB4\u0BC1",    # 114: ழு
    "\u0BB4\u0BC2",    # 115: ழூ
    "\u0BA9\u0BCD",    # 116: ன்
    "\u0BA9",          # 117: ன
    "\u0BA9\u0BBF",    # 118: னி
    "\u0BA9\u0BC0",    # 119: னீ
    "\u0BA9\u0BC1",    # 120: னு
    "\u0BB7\u0BBF",    # 121: ஷி
    "\u0BB7\u0BC0",    # 122: ஷீ
    "\u0BB7\u0BC1",    # 123: ஷு
    "\u0BB7\u0BC2",    # 124: ஷூ
    "\u0B95\u0BCD\u0BB7",        # 125: க்ஷ
    "\u0B95\u0BCD\u0BB7\u0BCD",  # 126: க்ஷ்
    "\u0B95\u0BCD\u0BB7\u0BBF",  # 127: க்ஷி
    "\u0B95\u0BCD\u0BB7\u0BC0",  # 128: க்ஷீ
    "\u0B9C\u0BC1",    # 129: ஜு
    "\u0B9C\u0BC2",    # 130: ஜூ
    "\u0BB9",          # 131: ஹ
    "\u0BB9\u0BCD",    # 132: ஹ்
    "\u0BB9\u0BBF",    # 133: ஹி
    "\u0BB9\u0BC0",    # 134: ஹீ
    "\u0BB9\u0BC1",    # 135: ஹு
    "\u0BB9\u0BC2",    # 136: ஹூ
    "\u0BB8",          # 137: ஸ
    "\u0BB8\u0BCD",    # 138: ஸ்
    "\u0BB8\u0BBF",    # 139: ஸி
    "\u0BB8\u0BC0",    # 140: ஸீ
    "\u0BB8\u0BC1",    # 141: ஸு
    "\u0BB8\u0BC2",    # 142: ஸூ
    "\u0BB7",          # 143: ஷ
    "\u0BB7\u0BCD",    # 144: ஷ்
    "\u0BA9\u0BC2",    # 145: னூ
    "\u0BB8\u0BCD\u0BB0\u0BC0",  # 146: ஸ்ரீ
    "\u0B95\u0BCD\u0BB7\u0BC2",  # 147: க்ஷூ
    "\u0B9C",          # 148: ஜ
    "\u0B9C\u0BCD",    # 149: ஜ்
    "\u0B9C\u0BBF",    # 150: ஜி
    "\u0B9C\u0BC0",    # 151: ஜீ
    "\u0B95\u0BCD\u0BB7\u0BC1",  # 152: க்ஷு
    "\u0BC6",          # 153: ெ (Ottrai kombu)
    "\u0BC7",          # 154: ே (Irattai kombu)
    "\u0BC8"           # 155: ை (Inai kombu / ai vowel sign)
]

# Ensure exactly 156 classes
assert len(TAMIL_156_CLASSES) == 156, f"Expected 156 classes, got {len(TAMIL_156_CLASSES)}"

INDEX_TO_CHAR = {idx: char for idx, char in enumerate(TAMIL_156_CLASSES)}
CHAR_TO_INDEX = {char: idx for idx, char in enumerate(TAMIL_156_CLASSES)}

def get_char(index: int) -> str:
    """Return Tamil character for given class index (0-155)."""
    return INDEX_TO_CHAR.get(index, "")

def get_index(char: str) -> int:
    """Return class index for given Tamil character."""
    return CHAR_TO_INDEX.get(char, -1)
