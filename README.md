# k-families-data

[위키데이터](https://wikidata.org)에 등록된 한반도 사람들의 가족 관계 그래프 데이터입니다.

* 인물 노드: https://akngs.github.io/k-families-data/persons.csv
* 국적 노드: https://akngs.github.io/k-families-data/nationalities.csv
* 인물-인물 관계: https://akngs.github.io/k-families-data/person2person.csv
* 인물-국적 관계: https://akngs.github.io/k-families-data/person2nationality.csv

데이터 활용 예시:

https://observablehq.com/@akngs/k-families-data

다음 기준으로 데이터를 수집합니다.

* 한반도의 국가(대한민국, 조선민주주의인민공화국, 조선, 고려 등)가 국적인 사람
* 그러한 사람의 직계 가족

기준에 부합하는 사람에 대하여 아래 정보를 저장합니다.

* 이름
* 성별
* 출생일
* 사망일
* 국적
* 직계 가족과의 관계

데이터 갱신 주기:

* 매일 오전 9시 0분에 1회 갱신
