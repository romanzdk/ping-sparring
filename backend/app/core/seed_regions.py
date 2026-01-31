"""
Seed script for Czech regions and districts.
This script populates the regions and districts tables with Czech administrative data.
"""

REGIONS_DATA = [
    {"name": "Hlavní město Praha", "code": "CZ010", "districts": [
        {"name": "Praha", "code": "CZ0100"}
    ]},
    {"name": "Středočeský kraj", "code": "CZ020", "districts": [
        {"name": "Benešov", "code": "CZ0201"},
        {"name": "Beroun", "code": "CZ0202"},
        {"name": "Kladno", "code": "CZ0203"},
        {"name": "Kolín", "code": "CZ0204"},
        {"name": "Kutná Hora", "code": "CZ0205"},
        {"name": "Mělník", "code": "CZ0206"},
        {"name": "Mladá Boleslav", "code": "CZ0207"},
        {"name": "Nymburk", "code": "CZ0208"},
        {"name": "Praha-východ", "code": "CZ0209"},
        {"name": "Praha-západ", "code": "CZ020A"},
        {"name": "Příbram", "code": "CZ020B"},
        {"name": "Rakovník", "code": "CZ020C"},
    ]},
    {"name": "Jihočeský kraj", "code": "CZ031", "districts": [
        {"name": "České Budějovice", "code": "CZ0311"},
        {"name": "Český Krumlov", "code": "CZ0312"},
        {"name": "Jindřichův Hradec", "code": "CZ0313"},
        {"name": "Písek", "code": "CZ0314"},
        {"name": "Prachatice", "code": "CZ0315"},
        {"name": "Strakonice", "code": "CZ0316"},
        {"name": "Tábor", "code": "CZ0317"},
    ]},
    {"name": "Plzeňský kraj", "code": "CZ032", "districts": [
        {"name": "Domažlice", "code": "CZ0321"},
        {"name": "Klatovy", "code": "CZ0322"},
        {"name": "Plzeň-město", "code": "CZ0323"},
        {"name": "Plzeň-jih", "code": "CZ0324"},
        {"name": "Plzeň-sever", "code": "CZ0325"},
        {"name": "Rokycany", "code": "CZ0326"},
        {"name": "Tachov", "code": "CZ0327"},
    ]},
    {"name": "Karlovarský kraj", "code": "CZ041", "districts": [
        {"name": "Cheb", "code": "CZ0411"},
        {"name": "Karlovy Vary", "code": "CZ0412"},
        {"name": "Sokolov", "code": "CZ0413"},
    ]},
    {"name": "Ústecký kraj", "code": "CZ042", "districts": [
        {"name": "Děčín", "code": "CZ0421"},
        {"name": "Chomutov", "code": "CZ0422"},
        {"name": "Litoměřice", "code": "CZ0423"},
        {"name": "Louny", "code": "CZ0424"},
        {"name": "Most", "code": "CZ0425"},
        {"name": "Teplice", "code": "CZ0426"},
        {"name": "Ústí nad Labem", "code": "CZ0427"},
    ]},
    {"name": "Liberecký kraj", "code": "CZ051", "districts": [
        {"name": "Česká Lípa", "code": "CZ0511"},
        {"name": "Jablonec nad Nisou", "code": "CZ0512"},
        {"name": "Liberec", "code": "CZ0513"},
        {"name": "Semily", "code": "CZ0514"},
    ]},
    {"name": "Královéhradecký kraj", "code": "CZ052", "districts": [
        {"name": "Hradec Králové", "code": "CZ0521"},
        {"name": "Jičín", "code": "CZ0522"},
        {"name": "Náchod", "code": "CZ0523"},
        {"name": "Rychnov nad Kněžnou", "code": "CZ0524"},
        {"name": "Trutnov", "code": "CZ0525"},
    ]},
    {"name": "Pardubický kraj", "code": "CZ053", "districts": [
        {"name": "Chrudim", "code": "CZ0531"},
        {"name": "Pardubice", "code": "CZ0532"},
        {"name": "Svitavy", "code": "CZ0533"},
        {"name": "Ústí nad Orlicí", "code": "CZ0534"},
    ]},
    {"name": "Vysočina", "code": "CZ063", "districts": [
        {"name": "Havlíčkův Brod", "code": "CZ0631"},
        {"name": "Jihlava", "code": "CZ0632"},
        {"name": "Pelhřimov", "code": "CZ0633"},
        {"name": "Třebíč", "code": "CZ0634"},
        {"name": "Žďár nad Sázavou", "code": "CZ0635"},
    ]},
    {"name": "Jihomoravský kraj", "code": "CZ064", "districts": [
        {"name": "Blansko", "code": "CZ0641"},
        {"name": "Brno-město", "code": "CZ0642"},
        {"name": "Brno-venkov", "code": "CZ0643"},
        {"name": "Břeclav", "code": "CZ0644"},
        {"name": "Hodonín", "code": "CZ0645"},
        {"name": "Vyškov", "code": "CZ0646"},
        {"name": "Znojmo", "code": "CZ0647"},
    ]},
    {"name": "Olomoucký kraj", "code": "CZ071", "districts": [
        {"name": "Jeseník", "code": "CZ0711"},
        {"name": "Olomouc", "code": "CZ0712"},
        {"name": "Prostějov", "code": "CZ0713"},
        {"name": "Přerov", "code": "CZ0714"},
        {"name": "Šumperk", "code": "CZ0715"},
    ]},
    {"name": "Zlínský kraj", "code": "CZ072", "districts": [
        {"name": "Kroměříž", "code": "CZ0721"},
        {"name": "Uherské Hradiště", "code": "CZ0722"},
        {"name": "Vsetín", "code": "CZ0723"},
        {"name": "Zlín", "code": "CZ0724"},
    ]},
    {"name": "Moravskoslezský kraj", "code": "CZ080", "districts": [
        {"name": "Bruntál", "code": "CZ0801"},
        {"name": "Frýdek-Místek", "code": "CZ0802"},
        {"name": "Karviná", "code": "CZ0803"},
        {"name": "Nový Jičín", "code": "CZ0804"},
        {"name": "Opava", "code": "CZ0805"},
        {"name": "Ostrava-město", "code": "CZ0806"},
    ]},
]
