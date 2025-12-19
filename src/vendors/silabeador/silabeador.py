# Source: https://github.com/fsanzl/silabeador
# Licensed under LGPL-2.1 license
# Patched at line 60 for file system compatibility

import re
# from importlib import resources

class Syllabification:
    """
    Class to handle syllabification and stress marking of words.
    """

    __vowels = 'aeiouáéíóúäëïöüàèìòùAEIOUÁÉÍÓÚÄËÏÓÜÀÈÌÒÙ'
    __close = 'iuIU'

    def __init__(self, word, exceptions=1, ipa=False, h=False, epen=False, tl=False):
        """
        Initialize the Syllabification class.

        :param word: The word to be syllabified.
        :param exceptions: Level of exceptions handling (0: none, 1: basic, 2: extended).
        :param ipa: Boolean indicating whether to use IPA rules.
        :param h: Boolean indicating whether to consider 'h' as a consonant.
        :param epen: Boolean indicating whether to apply epenthesis.
        :param tl: Boolean indicating whether to include 'tl' as an indivisible onset.
        """
        self.__ipa = ipa
        self.__h = h
        self.__tl = tl

        if epen:
            word = self.__epenthesis(word)

        if self.__ipa:
            self.__vowels += 'jw'
            self.__close += 'jw'

        if exceptions > 0:
            self.__hiatus = exceptions > 1
            self.__word = self.__make_exceptions(word)
            self.__word = self.__latin(self.__word)
        else:
            self.__word = word

        self.syllables = self.__syllabify(self.__word)
        self.stress = self.__stressed_syllable(self.syllables)

    def __make_exceptions(self, word):
        """
        Handle specific word exceptions during syllabification.

        :param word: The word to apply exceptions to.
        :return: The modified word with exceptions applied.
        """
        caparros = {'fie': 'fi_e', 'sua': 'su_a', 'rui': 'ru_i'}
        if self.__hiatus and any(word.startswith(x) for x in caparros):
            word = word.replace(word[:3], caparros[word[:3]])

        # Load exceptions list from resources
        # Patched to read from file system for compatibility
        with open("exceptions.lst") as f:
            lines = f.read()

        exceptions_list = [line.strip().split() for line in lines.splitlines() if line.strip() and not line.startswith('#')]

        for exception in exceptions_list:
            word = re.sub(rf'{exception[0]}', rf'{exception[1]}', word)

        return word

    @staticmethod
    def __epenthesis(word):
        """
        Apply epenthesis to the word.

        :param word: The word to apply epenthesis to.
        :return: The modified word with epenthesis applied.
        """
        liquidae = ('sch', 'sc', 'st', 'sp', 'sf', 'sb', 'sm', 'sn')
        if word.startswith(liquidae):
            for onset in liquidae:
                if word.startswith(onset):
                    if word[len(onset)] in 'aeiouáéíóúrl':
                        word = f'es_{onset[1:]}{word[len(onset):]}'
                    else:
                        word = f'e{onset}_{word[len(onset):]}'
                    break
        return word

    def __latin(self, word):
        """
        Apply Latin-specific syllabification and accentuation rules.

        :param word: The word to apply Latin rules to.
        :return: The modified word with Latin rules applied.
        """
        flexiones = ('um', 'em', 'at', 'ant', 'it', 'unt', 'am')
        dictionarium = {'a': 'á', 'e': 'é', 'i': 'í', 'o': 'ó', 'u': 'ú'}
        diphthongi = {'ae': 'æ', 'oe': 'œ'}

        if word.lower().endswith(flexiones) and not any(x in word.lower() for x in 'áéíóú'):
            word = word.lower()
            for flexio in flexiones:
                if word.endswith(flexio):
                    word = re.sub(fr'{flexio}\b', f'_{flexio}', word)
                    break

            for clavis, pretium in diphthongi.items():
                word = word.replace(clavis, pretium)

            syllables = self.__syllabify(word)
            if len(syllables) > 1:
                # Apply stress to the appropriate syllable
                if len(syllables) == 2 or (len(syllables) > 1 and (
                    any(dipht in syllables[-2] for dipht in diphthongi.values()) or
                    len([x for x in dictionarium.keys() if x in syllables[-2]]) > 1 or
                    not syllables[-2].endswith(tuple(dictionarium.keys())))):
                    for clavis, pretium in dictionarium.items():
                        if clavis in syllables[-2]:
                            syllables[-2] = syllables[-2].replace(clavis, pretium)
                            break
                elif any(dipht in syllables[-3] for dipht in diphthongi.values()) or (
                    len([x for x in dictionarium.keys() if x in syllables[-3]]) > 1 or
                    not syllables[-3].endswith(tuple(dictionarium.keys()))):
                    for clavis, pretium in dictionarium.items():
                        if clavis in syllables[-3]:
                            syllables[-3] = syllables[-3].replace(clavis, pretium)
                            break
                else:
                    for i in dictionarium:
                        syllables[-2] = syllables[-2].replace(i, dictionarium[i])
                        break

            word = syllables

        return word

    def __syllabify(self, word):
        """
        Split a word into its constituent syllables.

        :param word: The word to syllabify.
        :return: A list of syllables.
        """
        if isinstance(word, str):
            foreign_lig = {'à': 'a', 'è': 'e', 'ì': 'i', 'ò': 'o', 'ù': 'u',
                           'ã': 'a', 'ẽ': 'e', 'ĩ': 'i', 'õ': 'o', 'ũ': 'u',
                           'ﬁ': 'fi', 'ﬂ': 'fl'}
            word = re.sub(r'\W', '', word)
            word = ''.join([foreign_lig.get(letter, letter) for letter in word])
            syllables = self.__split(word)
            syllables = self.__join(syllables)
            return [x.strip() for x in syllables]
        return word

    def __split(self, word, syllables=None):
        """
        Recursively split a word into a list of syllables.

        :param word: The word to split.
        :param syllables: The list of syllables built so far.
        :return: A list of syllables.
        """
        syllables = syllables or []
        diphthong = re.search(rf'(?:[qg][wuü](?:[eé](?:h*[{self.__close}])'
                              r'{,1}|i(?:h*[aeoáéó]){,1}|í)|'
                              rf'[{self.__close}](?:h*[aáoóeéi])(?:h*[{self.__close}])'
                              r'{,1}|'
                              rf'[aáoóeéií](?:h*[{self.__close}]))\b', word)
        digraph = ('ll', 'ch', 'rr')

        if diphthong:
            diphthong = diphthong.group().strip('gq')
            syllables = self.__split(word.removesuffix(diphthong), [diphthong] + syllables)
        elif word.endswith(digraph):
            syllables = self.__split(word[:-2], [word[-2:]] + syllables)
        elif word:
            syllables = self.__split(word[:-1], [word[-1]] + syllables)

        return syllables

    def __join(self, syllables):
        """
        Join syllables according to specific phonological rules.

        :param syllables: The list of syllables to join.
        :return: A list of syllables after applying joining rules.
        """
        indivisible_onset = ('pl', 'bl', 'fl', 'cl', 'kl', 'gl', 'll',
                             'pr', 'br', 'fr', 'cr', 'kr', 'gr', 'rr',
                             'dr', 'tr', 'ch', 'dh', 'rh', 'th',
                             'βl', 'ɣl',
                             'βɾ', 'pɾ', 'fɾ', 'kɾ', 'gɾ', 'ɣɾ', 'dɾ', 'ðɾ',
                             'tɾ', 'bɾ', 'tʃ', 'gw', 'ɣw')
        if self.__tl:
            indivisible_onset += ('tl',)

        indivisible_coda = ('ns', 'bs', 'nz', 'βs', 'bz', 'βz', 'nd', 'rt',
                            'st', 'ff', 'ls', 'lz', 'zz', 'll', 'nt', 'rs', 'ɾs',
                            'ch', 'nk', 'nc', 'lk', 'sh', 'nt', 'sch', 'mp', 'rd')

        word = []
        onset = ''

        for letter in syllables:
            if letter == '_':
                if word:
                    word[-1] += onset
                    onset = ''
            elif all(x.lower() not in self.__vowels for x in letter):
                if onset.endswith('y'):
                    if onset == 'y' and word[-1][-1] in 'AOEÁÓÉaoeáóé':
                        word[-1] += onset
                    else:
                        word += [onset]
                    onset = letter
                else:
                    onset += letter
                    if len(word) > 0:
                        media = len(onset) // 2
                    if self.__h and onset.endswith('h'):
                        media = 0
            elif len(onset) <= 1 or not word:
                word += [onset + letter]
                onset = ''
            elif onset.endswith(indivisible_onset):
                if word:
                    word[-1] += onset[:-2]
                    word += [onset[-2:] + letter]
                else:
                    word += [onset + letter]
                onset = ''
            elif onset.startswith(indivisible_coda) and len(onset) > 2:
                word[-1] += onset[:2]
                word += [onset[2:] + letter]
                onset = ''
            elif (onset[-1] in 'dðfkt' and
                  onset[-2] in 'bβcθkdðfgɣkmɱɲñpqstvwxχzjw'
                  or onset[-1] in 'gɣ' and onset[-2] in 'cθtkjw'
                  or onset[-1] in 'lmɱ' and onset[-2] in 'mɱl'
                  or onset[-1] in 'cθ' and onset[-2] in 'kc'):
                word[-1] += onset[:-1]
                word += [onset[-1] + letter]
                onset = ''
            else:
                word[-1] += onset[:media]
                word += [onset[media:] + letter]
                onset = ''

        if onset:
            if len(word) < 1:
                word = [onset]
            elif onset.endswith('y') and len(onset) == 1:
                word[-1] += onset
            elif onset.endswith('y'):
                word[-1] += onset[:-2]
                word += [onset[-2:]]
            else:
                word[-1] += onset

        return word

    def __stressed_syllable(self, syllables):
        """
        Determine the stressed syllable index in the list of syllables.

        :param syllables: The list of syllables.
        :return: The index of the stressed syllable.
        """
        if len(syllables) == 1:
            return -1
        elif any(k in 'áéíóúÁÉÍÓÚ' for k in ''.join(syllables)):
            for i, syllable in enumerate(syllables):
                if any(k in 'áéíóúÁÉÍÓÚ' for k in syllable):
                    return i - len(syllables)
        elif syllables[-1][-1] in 'yY' and syllables[-1][-2] in 'aeiouAEIOU':
            return -1
        elif syllables[-1][-1] in 'aeiouAEIOUy':
            return -2
        elif syllables[-1][-1] in 'nsNS' and syllables[-1][-2] in 'aeiouAEIOU':
            return -2
        else:
            return -1


def syllabify(word, exceptions=1, ipa=False, h=False, epen=False, tl=False):
    """
    Public function to syllabify a word.

    :param word: The word to syllabify.
    :param exceptions: Level of exceptions handling (0: none, 1: basic, 2: extended).
    :param ipa: Boolean indicating whether to use IPA rules.
    :param h: Boolean indicating whether to consider 'h' as a consonant.
    :param epen: Boolean indicating whether to apply epenthesis.
    :param tl: Boolean indicating whether to include 'tl' as an indivisible onset.
    :return: A list of syllables.
    """
    return Syllabification(word, exceptions, ipa, h, epen, tl).syllables


def tonica(word, exceptions=1, ipa=False, h=False, epen=False, tl=False):
    """
    Public function to get the index of the stressed syllable.

    :param word: The word to analyze for stress.
    :param exceptions: Level of exceptions handling (0: none, 1: basic, 2: extended).
    :param ipa: Boolean indicating whether to use IPA rules.
    :param h: Boolean indicating whether to consider 'h' as a consonant.
    :param epen: Boolean indicating whether to apply epenthesis.
    :param tl: Boolean indicating whether to include 'tl' as an indivisible onset.
    :return: The index of the stressed syllable.
    """
    return Syllabification(word, exceptions, ipa, h, epen, tl).stress

# Added for worker usage
def split_words(words):
    return [syllabify(w) for w in words]