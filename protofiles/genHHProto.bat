@REM :: ����������Ĳ���ʹ�øýű�
@REM :: 1.���ȱ����Ѿ���װ��nodejs
@REM :: 2.�ڱ�Ŀ¼����npm install
@REM :: 3.���б�bat���ȴ�����

:: ��д��Ϊ�����proto�ļ�
@SET protofiles=*.proto

:: ����ļ����֣���������׺
@SET outputName=protoHH

:: ���Ϊjsonģ��
@call ./node_modules/.bin/pbjs -t commonjs %protofiles% -o %outputName%.js
@if %errorlevel% neq 0 goto :EXIT_HERE

:: �������޸������js�ļ��ĵ�һ�У�"protobufjs"�޸�Ϊ��"../protobufjs/protobuf"
:: @SET cmdstr="(gc %outputName%.js) -replace '"protobufjs"', '"../protobufjs/protobuf"' | Out-File -Encoding 'UTF8'  %outputName%.js"
:: @powershell -Command %cmdstr%

:: ����js�ļ����.d.ts�ļ��Ա�typescript���������ͼ��
:: @call guohua %outputName%.js -o %outputName%.d.ts
@node ./guohua.js %outputName%.js -o %outputName%.d.ts
@node ./guohua.js %outputName%.js -x "protobuf"
@COPY /B %outputName%.d.ts ..\assets\Script\modules\lobby\protoHH\
@COPY /B %outputName%.js ..\assets\Script\modules\lobby\protoHH\
@DEL /Q %outputName%.d.ts
@DEL /Q %outputName%.js
:EXIT_HERE
@pause
