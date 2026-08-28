from __future__ import annotations

import json
import re
import subprocess
from pathlib import Path

PATH = Path('src/data/editorialCatalog.json')
CURRENT = json.loads(PATH.read_text(encoding='utf-8'))
BASE_TEXT = subprocess.check_output(
    ['git', 'show', 'origin/main:src/data/editorialCatalog.json'],
    text=True,
    encoding='utf-8',
)


def matching_close(text: str, open_index: int, opener: str, closer: str) -> int:
    depth = 0
    in_string = False
    escaped = False
    for index in range(open_index, len(text)):
        char = text[index]
        if in_string:
            if escaped:
                escaped = False
            elif char == '\\':
                escaped = True
            elif char == '"':
                in_string = False
            continue
        if char == '"':
            in_string = True
        elif char == opener:
            depth += 1
        elif char == closer:
            depth -= 1
            if depth == 0:
                return index
    raise AssertionError(f'No matching {closer} found')


def property_block(name: str, value: object, indent: int = 4) -> str:
    rendered = json.dumps(value, ensure_ascii=False, indent=2).splitlines()
    prefix = ' ' * indent
    return f'{prefix}"{name}": {rendered[0]}\n' + '\n'.join(prefix + line for line in rendered[1:])


def object_block(value: object, indent: int = 4) -> str:
    prefix = ' ' * indent
    return '\n'.join(prefix + line for line in json.dumps(value, ensure_ascii=False, indent=2).splitlines())


def differences(left: object, right: object, path: str = '$') -> list[str]:
    found: list[str] = []
    if type(left) is not type(right):
        return [f'{path}: type {type(left).__name__} != {type(right).__name__}']
    if isinstance(left, dict):
        left_keys = set(left)
        right_keys = set(right)
        for key in sorted(left_keys - right_keys):
            found.append(f'{path}.{key}: missing from reconstructed result')
        for key in sorted(right_keys - left_keys):
            found.append(f'{path}.{key}: unexpectedly present in reconstructed result')
        for key in sorted(left_keys & right_keys):
            found.extend(differences(left[key], right[key], f'{path}.{key}'))
            if len(found) >= 20:
                break
        return found[:20]
    if isinstance(left, list):
        if len(left) != len(right):
            found.append(f'{path}: list length {len(left)} != {len(right)}')
        for index, (left_item, right_item) in enumerate(zip(left, right)):
            found.extend(differences(left_item, right_item, f'{path}[{index}]'))
            if len(found) >= 20:
                break
        return found[:20]
    if left != right:
        return [f'{path}: {left!r} != {right!r}']
    return []


text = BASE_TEXT

needs_marker = '  "needs": {'
needs_marker_index = text.index(needs_marker)
needs_open = text.index('{', needs_marker_index)
needs_close = matching_close(text, needs_open, '{', '}')
needs_newline = text.rfind('\n', 0, needs_close)
honesty_block = property_block('honesty', CURRENT['needs']['honesty'])
text = text[:needs_newline] + ',\n' + honesty_block + text[needs_newline:]

# Recompute the full needs-object boundary after inserting Honesty, then find the
# top-level strategy catalog that follows it rather than a nested Need strategy list.
needs_open = text.index('{', needs_marker_index)
needs_close = matching_close(text, needs_open, '{', '}')
strategies_marker = '  "strategies": ['
strategies_marker_index = text.index(strategies_marker, needs_close)
strategies_open = text.index('[', strategies_marker_index)
strategies_close = matching_close(text, strategies_open, '[', ']')
strategies_newline = text.rfind('\n', 0, strategies_close)
approved_slugs = {
    'sort-what-you-know',
    'practice-saying-what-you-mean',
    'rehearse-what-you-wish-you-had-said',
}
approved_strategies = [
    strategy for strategy in CURRENT['strategies']
    if strategy.get('slug') in approved_slugs
]
assert [strategy['slug'] for strategy in approved_strategies] == [
    'sort-what-you-know',
    'practice-saying-what-you-mean',
    'rehearse-what-you-wish-you-had-said',
]
strategy_addition = ',\n' + ',\n'.join(object_block(strategy) for strategy in approved_strategies)
text = text[:strategies_newline] + strategy_addition + text[strategies_newline:]

for slug in [
    'write-three-sentences',
    'observation-only',
    'self-check-scale',
    'name-a-want-a-don-t',
]:
    pattern = rf'^    "{re.escape(slug)}": \[[^\n]*\],\n'
    text, count = re.subn(pattern, '', text, count=1, flags=re.MULTILINE)
    if count != 1:
        raise AssertionError(f'Expected one strategyNeedRemovals line for {slug}, found {count}')

result = json.loads(text)
if result != CURRENT:
    for difference in differences(CURRENT, result):
        print(difference)
    raise AssertionError('Formatting cleanup changed editorial catalog semantics')

PATH.write_text(text, encoding='utf-8')
print('Editorial catalog formatting normalized with identical semantics.')
