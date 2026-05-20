import os


def test_constitution_exists():
    assert os.path.exists("CONSTITUTION.md"), "CONSTITUTION.md 檔案應存在"


def test_constitution_has_mandatory_sections():
    text = open("CONSTITUTION.md", encoding="utf-8").read()
    assert "目的" in text
    assert "原則" in text
    assert "測試與品質保證" in text
