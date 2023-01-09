node ~/dev/r.js -o mainConfigFile=main.js baseUrl=.
rm -r ../build/common
rm -r ../build/Solitaire
rm -r ../build/stats
rm -r ../build/UI
rm -r ../build/view
rm -r ../build/vendor
rm -r ../build/docs
rm ../build/build.txt
rm ../build/build.sh
cp vendor/require.min.js ../build
