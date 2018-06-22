# Autorebase
Обновляет актуальность ветки в нескольких репозиториях.
## Установка
```
npm i autorebase -g
```
## Запуск
```
autorebase [-b=branch] [-d=dir] [-m=modules]
```
### Параметры
 `-b --branch` string - Ветка

 `-d --dir` string - Директория с модулями

 `-m --modules` ?string[] - Названия модулей записанные через запятую.

  `-p --push` ?boolean - Пушит в мастер.
#### Пример
```
autorebase -b="branch" -d=c:\dir -m="moduleA, moduleB" -p
```
